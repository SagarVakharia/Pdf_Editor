/**
 * JsonLd — Server component that injects structured data (JSON-LD) into the <head>.
 *
 * Usage:
 *   <JsonLd data={schema} />
 *
 * Pass any valid Schema.org JSON object. The component renders a
 * <script type="application/ld+json"> tag that Google and other search
 * engines use for rich results.
 */

interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Next.js App Router: dangerouslySetInnerHTML in a Server Component is safe here
      // because the data is always a serialised JS object we control — no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ── Pre-built schemas ──────────────────────────────────────────────────────

/** WebApplication schema for the PDF Master tool */
export const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PDF Master',
  url: 'https://pdf-editor-f1av.vercel.app',
  description:
    'Free online PDF editor. Edit, annotate, sign and modify PDFs directly in your browser. No installation or account required.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires a modern browser with JavaScript enabled.',
  inLanguage: 'en',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  // ⚠️  aggregateRating intentionally omitted until real user reviews are collected.
  // To add it back, uncomment and fill in real data:
  // aggregateRating: {
  //   '@type': 'AggregateRating',
  //   ratingValue: '4.8',      ← use real average
  //   ratingCount: '50',       ← use real review count
  //   bestRating: '5',
  //   worstRating: '1',
  // },
  featureList: [
    'Edit PDF text',
    'Sign PDF online',
    'Annotate PDF',
    'Draw on PDF',
    'Add images to PDF',
    'Add stamps to PDF',
    'Rearrange PDF pages',
    'Download edited PDF',
  ],
  screenshot: 'https://pdf-editor-f1av.vercel.app/og-image.png',
  creator: {
    '@type': 'Organization',
    name: 'PDF Master',
    url: 'https://pdf-editor-f1av.vercel.app',
  },
};

/** BreadcrumbList schema helper */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Article schema for blog posts */
export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: {
      '@type': 'Organization',
      name: 'PDF Master',
      url: 'https://pdf-editor-f1av.vercel.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PDF Master',
      url: 'https://pdf-editor-f1av.vercel.app',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': opts.url,
    },
  };
}
