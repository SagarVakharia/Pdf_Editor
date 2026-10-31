import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import net from 'net';
import dns from 'dns';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Maximum allowed proxied PDF size: 30 MB
const MAX_FILE_SIZE = 30 * 1024 * 1024;
// Upstream request timeout: 10 seconds
const FETCH_TIMEOUT_MS = 10000;

// Middleware
app.use(helmet());

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://pdf-editor-f1av.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl/mobile) or listed origins
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    optionsSuccessStatus: 200
}));

// Rate limiting to prevent brute force / DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);
app.use(express.json());

// ── SSRF Defense Helpers ───────────────────────────────────────────────────

function isPrivateOrReservedIP(ip: string): boolean {
    // If IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    if (net.isIPv4(ip)) {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) return true;
        const [a, b, c] = parts;

        // 0.0.0.0/8 (Broadcast/Current network)
        if (a === 0) return true;
        // 10.0.0.0/8 (Private RFC 1918)
        if (a === 10) return true;
        // 127.0.0.0/8 (Loopback)
        if (a === 127) return true;
        // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
        if (a === 169 && b === 254) return true;
        // 172.16.0.0/12 (Private RFC 1918)
        if (a === 172 && b >= 16 && b <= 31) return true;
        // 192.168.0.0/16 (Private RFC 1918)
        if (a === 192 && b === 168) return true;
        // 100.64.0.0/10 (Carrier Grade NAT RFC 6598)
        if (a === 100 && b >= 64 && b <= 127) return true;
        // 192.0.0.0/24 (IETF Protocol Assignments)
        if (a === 192 && b === 0 && c === 0) return true;
        // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation / TEST-NET)
        if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return true;
        // 198.18.0.0/15 (Benchmarking)
        if (a === 198 && (b === 18 || b === 19)) return true;
        // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
        if (a >= 224) return true;

        return false;
    }

    if (net.isIPv6(ip)) {
        const normalized = ip.toLowerCase();
        // Loopback ::1
        if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
        // Unspecified ::
        if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
        // Unique local fc00::/7 (fc00:: to fdff::)
        if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
        // Link-local fe80::/10 (fe80:: to febf::)
        if (/^fe[89ab][0-9a-f]/i.test(normalized)) return true;
        // Multicast ff00::/8
        if (normalized.startsWith('ff')) return true;

        return false;
    }

    // Unrecognized IP format -> reject by default
    return true;
}

async function validateUrlSafety(urlStr: string): Promise<URL> {
    let parsed: URL;
    try {
        parsed = new URL(urlStr);
    } catch {
        throw new Error('Invalid URL format');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS protocols are allowed');
    }

    // Restrict ports to standard web ports
    const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
    if (port !== 80 && port !== 443 && port !== 8080 && port !== 8443) {
        throw new Error(`Port ${port} is not permitted for proxying`);
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1') {
        throw new Error('Access to localhost or loopback is forbidden');
    }

    // DNS lookup to prevent DNS rebinding and internal network probing
    let addresses: dns.LookupAddress[];
    try {
        addresses = await dns.promises.lookup(hostname, { all: true });
    } catch (e) {
        throw new Error(`DNS resolution failed for hostname: ${hostname}`);
    }

    if (!addresses || addresses.length === 0) {
        throw new Error(`Hostname could not be resolved: ${hostname}`);
    }

    for (const addr of addresses) {
        if (isPrivateOrReservedIP(addr.address)) {
            throw new Error(`Access to private, local, or metadata IP is forbidden (${addr.address})`);
        }
    }

    return parsed;
}

async function fetchSafePdf(initialUrl: string, maxRedirects = 3): Promise<globalThis.Response> {
    let currentUrl = initialUrl;

    for (let hop = 0; hop <= maxRedirects; hop++) {
        await validateUrlSafety(currentUrl);

        const response = await fetch(currentUrl, {
            redirect: 'manual',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {
                'User-Agent': 'PDFMaster-Proxy/1.0 (+https://pdf-editor.local)',
                'Accept': 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.1'
            }
        });

        // Handle redirects safely with re-validation
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location) {
                throw new Error('Redirect response missing Location header');
            }
            currentUrl = new URL(location, currentUrl).toString();
            continue;
        }

        return response;
    }

    throw new Error('Too many redirects');
}

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
    res.send('PDF Editor Backend is running');
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get(['/proxy', '/api/proxy'], async (req, res) => {
    const url = req.query.url as string;
    if (!url || typeof url !== 'string') {
        res.status(400).send('URL query parameter is required');
        return;
    }

    try {
        const response = await fetchSafePdf(url);

        if (!response.ok) {
            res.status(response.status).send(`Failed to fetch URL: ${response.statusText}`);
            return;
        }

        const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
        const isPdfOrBinary = contentType.includes('pdf') ||
            contentType.includes('octet-stream') ||
            contentType.includes('binary') ||
            !contentType ||
            url.toLowerCase().split('?')[0].endsWith('.pdf');

        if (!isPdfOrBinary) {
            res.status(400).send(`Invalid content type: ${contentType}. Only PDF documents can be proxied.`);
            return;
        }

        const contentLengthHeader = response.headers.get('content-length');
        if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_FILE_SIZE) {
            res.status(413).send(`File exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        if (!response.body) {
            res.status(500).send('Empty response received from remote server');
            return;
        }

        // Stream and verify byte count dynamically to prevent memory exhaustion DoS
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                totalBytes += value.length;
                if (totalBytes > MAX_FILE_SIZE) {
                    await reader.cancel();
                    res.status(413).send(`File exceeded maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
                    return;
                }
                chunks.push(value);
            }
        }

        const buffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', buffer.length.toString());
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.send(buffer);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown proxy error';
        if (message.includes('forbidden') || message.includes('protocols')) {
            res.status(403).send(`SSRF Protection: ${message}`);
        } else if (message.includes('timeout') || message.includes('Timeout')) {
            res.status(504).send('Request timed out while fetching PDF');
        } else {
            res.status(400).send(`Proxy error: ${message}`);
        }
    }
});

// Serve uploaded files safely
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, {
    dotfiles: 'ignore',
    index: false,
    maxAge: '1d'
}));

// Global error handling middleware (prevents leaking internal stack traces)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
