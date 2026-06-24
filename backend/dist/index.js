"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || '*' : 'http://localhost:3000',
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
    res.send('PDF Editor Backend is running');
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.get('/api/proxy', async (req, res) => {
    const url = req.query.url;
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
    }
    catch (error) {
        res.status(500).send(`Proxy error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// Serve uploaded files (if any)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Keep alive hack to debug premature exit
    setInterval(() => { }, 10000);
});
exports.default = app;
