import type { MetadataRoute } from 'next';

const BASE_URL = 'https://pdf-editor-f1av.vercel.app';

/**
 * Next.js App Router sitemap.
 * Accessible at /sitemap.xml — submitted to Google Search Console.
 *
 * Update this list whenever you add new pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/editor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/how-to-edit-pdf-online-free`,
      lastModified: new Date('2026-07-01'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/blog/sign-pdf-without-software`,
      lastModified: new Date('2026-07-01'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/blog/best-free-pdf-tools-2026`,
      lastModified: new Date('2026-07-01'),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
  ];
}
