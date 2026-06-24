import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || '*' : 'http://localhost:3000',
    optionsSuccessStatus: 200
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('PDF Editor Backend is running');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/api/proxy', async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
        res.status(400).send('URL is required');
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
