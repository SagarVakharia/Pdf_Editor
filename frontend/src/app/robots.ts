import type { MetadataRoute } from 'next';

/**
 * Next.js App Router robots.txt.
 * Accessible at /robots.txt — tells crawlers what to index and where the sitemap is.
 *
 * Rules:
 *   - Allow all public pages
 *   - Block /api/ routes (no value for SEO, reduces crawl budget waste)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: 'https://pdf-editor-f1av.vercel.app/sitemap.xml',
    host: 'https://pdf-editor-f1av.vercel.app',
  };
}
