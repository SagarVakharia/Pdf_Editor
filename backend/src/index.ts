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
app.use(cors()); // Configure origin in production
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('PDF Editor Backend is running');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Serve uploaded files (if any)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Keep alive hack to debug premature exit
    setInterval(() => { }, 10000);
});

export default app;
