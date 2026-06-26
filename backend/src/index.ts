import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || ''] 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl) or allowed origins
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}));

// Rate limiting to prevent brute force / DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true, 
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('PDF Editor Backend is running');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get(['/proxy', '/api/proxy'], async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
        res.status(400).send('URL is required');
        return;
    }

    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            res.status(400).send('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
            return;
        }

        const hostname = parsedUrl.hostname.toLowerCase();
        // Basic SSRF Protection: Block local, loopback, and cloud metadata IPs
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
        const isMetadata = hostname === '169.254.169.254' || hostname === '169.254.169.253';
        const isPrivate = hostname.startsWith('10.') || hostname.startsWith('192.168.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

        if (isLocalhost || isMetadata || isPrivate) {
            res.status(403).send('Access to local, private, or metadata IP addresses is forbidden');
            return;
        }
    } catch (e) {
        res.status(400).send('Invalid URL format');
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            res.status(response.status).send(`Failed to fetch URL: ${response.statusText}`);
            return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/pdf');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(buffer);
    } catch (error) {
        res.status(500).send(`Proxy error: ${error instanceof Error ? error.message : String(error)}`);
    }
});

// Serve uploaded files (if any)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Keep alive hack to debug premature exit
    setInterval(() => { }, 10000);
});

export default app;
