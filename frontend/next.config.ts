import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Image Optimization ────────────────────────────────────────────────────
  // Enable modern image formats (AVIF first, then WebP) for next/image components.
  // Browsers that don't support AVIF automatically fall back to WebP, then the
  // original format — reducing image payload by 30–50% on average.
  images: {
    formats: ['image/avif', 'image/webp'],
    // Explicitly allow serving images from the Vercel deployment URL
    remotePatterns: [],
  },

  // ── Compression ───────────────────────────────────────────────────────────
  // Enable gzip/brotli compression (default: true in Next.js, but explicit is better)
  compress: true,

  // ── Power headers for SEO & performance ──────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Tell browsers they can cache immutable Next.js static assets aggressively
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Long-cache the PDF worker — it's a large static file that rarely changes
        source: '/pdf.worker.min.mjs',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
