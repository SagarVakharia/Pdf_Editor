# Modern PDF Editor - Backend

This is the backend server for the Modern PDF Editor ecosystem.

## Features
- Provides essential API endpoints for advanced PDF processing capabilities that cannot be handled entirely client-side.
- Structured for scalability with Express and Node.js.

## Security
- **Strict CORS**: Only allows connections from authorized frontend domains (configurable via `FRONTEND_URL` environment variable).
- **Rate Limiting**: Protects against brute-force and DDoS attacks with a 100 requests per 15-minute window limit per IP.
- **SSRF Protection**: The PDF proxy endpoint blocks requests to internal IP addresses (localhost, 127.0.0.1, AWS/GCP metadata endpoints, and private subnets) to prevent Server-Side Request Forgery.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

By default, the server should run on your designated local port (typically 5000 or similar). Check your configuration files for details.
