import type { Metadata } from 'next';
import { Inter, Dancing_Script, Pacifico, Caveat } from 'next/font/google';
import './globals.css';
import StoreProvider from './StoreProvider';
import Script from 'next/script';
import JsonLd, { webAppSchema } from '@/components/JsonLd';

// ── Primary body font ──────────────────────────────────────────────────────
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

// ── Signature / handwriting fonts (used in SignatureModal) ─────────────────
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-dancing-script',
});

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-pacifico',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-caveat',
});

// ── Keyword-optimised metadata ────────────────────────────────────────────
export const metadata: Metadata = {
  // Canonical base URL — update to your custom domain once you have one
  metadataBase: new URL('https://pdf-editor-f1av.vercel.app'),

  title: {
    default: 'PDF Master — Free Online PDF Editor | Edit, Sign & Annotate PDFs',
    template: '%s | PDF Master',
  },
  description:
    'Edit, annotate, sign, and modify PDFs for free — directly in your browser. No installation, no account needed. 100% private: your files never leave your device.',
  keywords: [
    'free online PDF editor',
    'edit PDF in browser',
    'sign PDF online free',
    'annotate PDF online',
    'PDF tools free',
    'merge PDF',
    'PDF editor no download',
    'sign PDF without software',
  ],

  // ── Canonical / alternates ───────────────────────────────────────────────
  alternates: {
    canonical: '/',
  },

  // ── Open Graph (Facebook, LinkedIn, WhatsApp, etc.) ──────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pdf-editor-f1av.vercel.app',
    siteName: 'PDF Master',
    title: 'PDF Master — Free Online PDF Editor',
    description:
      'Edit, annotate, sign, and modify PDFs for free — directly in your browser. No installation, no login needed.',
    images: [
      {
        url: '/og-image.png', // we'll use the app icon; replace with a 1200×630 image for best results
        width: 1200,
        height: 630,
        alt: 'PDF Master — Free Online PDF Editor',
      },
    ],
  },

  // ── Twitter / X Cards ────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Master — Free Online PDF Editor',
    description:
      'Edit, sign & annotate PDFs for free in your browser. No software to install.',
    images: ['/og-image.png'],
  },

  // ── Google Search Console verification ───────────────────────────────────
  // Using HTML FILE method — the verification file lives at:
  // frontend/public/google188859dbc4205e2b.html
  // No meta tag needed for this method.
  // (If you ever switch to HTML tag method, add: verification: { google: 'CONTENT_VALUE' })

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Combine all font CSS variables so they're available globally
  const fontVars = [
    inter.variable,
    dancingScript.variable,
    pacifico.variable,
    caveat.variable,
  ].join(' ');

  return (
    <html lang="en" className={fontVars}>
      <head>
        {/* Structured data — WebApplication schema for Google rich results */}
        <JsonLd data={webAppSchema} />
        {/* Google Analytics (GA4) — set NEXT_PUBLIC_GA_ID in your Vercel env vars */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
