import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import JsonLd, { articleSchema, breadcrumbSchema } from '@/components/JsonLd';

const POST = {
  title: 'Best Free PDF Tools in 2026 — Edit, Sign & Convert Without Paying',
  description:
    'A comprehensive, honest comparison of the best free online PDF tools in 2026 — for editing, signing, converting, and more. No sponsored rankings.',
  url: 'https://pdf-editor-f1av.vercel.app/blog/best-free-pdf-tools-2026',
  datePublished: '2026-07-01',
};

export const metadata: Metadata = {
  title: POST.title,
  description: POST.description,
  alternates: { canonical: '/blog/best-free-pdf-tools-2026' },
  openGraph: {
    title: POST.title,
    description: POST.description,
    url: POST.url,
    type: 'article',
  },
};

const tools = [
  {
    name: 'PDF Master',
    tagline: 'Best overall free PDF editor',
    link: '/editor',
    stars: 5,
    pros: ['100% browser-based — no upload to servers', 'Full editing: text, draw, sign, stamps, images', 'Completely free, no account needed', 'Dark mode, keyboard shortcuts, page management'],
    cons: ['No PDF-to-Word conversion (yet)', 'No OCR for scanned documents'],
    verdict: 'The best choice for anyone who needs a full-featured, private PDF editor at zero cost.',
  },
  {
    name: 'Smallpdf',
    tagline: 'Best for PDF conversion',
    link: 'https://smallpdf.com',
    stars: 4,
    pros: ['Excellent PDF-to-Word / Word-to-PDF conversion', 'Compression and merge tools', 'Clean interface'],
    cons: ['Free tier limited to 2 tasks/day', 'Files are uploaded to their servers', 'Watermarks on free downloads for some tools'],
    verdict: 'Great for one-off conversions, but the free tier is very restricted for daily use.',
  },
  {
    name: 'ILovePDF',
    tagline: 'Best for bulk PDF operations',
    link: 'https://www.ilovepdf.com',
    stars: 4,
    pros: ['Wide range of tools (merge, split, compress, convert)', 'Batch processing', 'No account required for basic use'],
    cons: ['Files are uploaded to their servers', 'Basic annotation tools', 'Ads on free plan'],
    verdict: 'Solid for document management tasks like merging and splitting, less suited for detailed editing.',
  },
  {
    name: 'Adobe Acrobat Free',
    tagline: 'Brand recognition, limited free features',
    link: 'https://www.adobe.com/acrobat/online.html',
    stars: 3,
    pros: ['Trusted brand', 'Good OCR for scanned PDFs', 'Integrated with Creative Cloud'],
    cons: ['Most features locked behind $19.99/month subscription', 'Requires account creation', 'Files uploaded to Adobe servers'],
    verdict: 'The free tier is severely limited — you get better value from free alternatives.',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function BestPdfToolsPage() {
  return (
    <div className="min-h-screen bg-background text-text-main">
      <JsonLd data={articleSchema({ title: POST.title, description: POST.description, url: POST.url, datePublished: POST.datePublished })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: 'https://pdf-editor-f1av.vercel.app' },
        { name: 'Blog', url: 'https://pdf-editor-f1av.vercel.app/blog' },
        { name: 'Best Free PDF Tools 2026', url: POST.url },
      ])} />

      {/* Header */}
      <header className="border-b border-white/10 py-5 px-4 sm:px-6">
        <nav aria-label="Site navigation" className="container mx-auto flex justify-between items-center">
          <Link href="/" aria-label="PDF Master home" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            PDF Master
          </Link>
          <Link href="/editor" aria-label="Open the free PDF editor" className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors">
            Open Editor
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-2 list-none">
            <li><Link href="/" className="hover:text-indigo-400 transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text-main truncate">Best Free PDF Tools 2026</li>
          </ol>
        </nav>

        <article>
          <header>
            <div className="flex items-center gap-3 mb-4 text-sm text-text-muted">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">Review</span>
              <time dateTime={POST.datePublished}>July 1, 2026</time>
              <span>6 min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Best Free PDF Tools in 2026
            </h1>
            <p className="text-lg text-text-muted mb-8 leading-relaxed">
              The PDF tool market is crowded with apps that promise "free" but hide features behind paywalls.
              We tested the most popular options so you can find the right tool for your actual needs —
              without wasting time or money.
            </p>
          </header>

          <div className="space-y-10 text-text-muted leading-relaxed">

            <section aria-labelledby="criteria">
              <h2 id="criteria" className="text-2xl font-bold text-text-main mb-4">How We Evaluated These Tools</h2>
              <p>We tested each tool against four key criteria:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li><strong className="text-text-main">Genuinely free</strong> — no hidden paywalls, no watermarks, no daily limits that make the tool unusable</li>
                <li><strong className="text-text-main">Privacy</strong> — does the tool upload your files to a server?</li>
                <li><strong className="text-text-main">Feature depth</strong> — can it handle real editing tasks, not just basic annotation?</li>
                <li><strong className="text-text-main">Ease of use</strong> — can a non-technical user edit a PDF in under 5 minutes?</li>
              </ul>
            </section>

            <section aria-labelledby="tools-list">
              <h2 id="tools-list" className="text-2xl font-bold text-text-main mb-6">The Best Free PDF Tools Compared</h2>

              <div className="space-y-8">
                {tools.map((tool, index) => (
                  <article key={tool.name} className="p-6 rounded-2xl border border-white/10 bg-sidebar/5">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-text-muted bg-white/5 px-2 py-0.5 rounded">#{index + 1}</span>
                          <h3 className="text-xl font-bold text-text-main">{tool.name}</h3>
                        </div>
                        <p className="text-sm text-indigo-400 font-medium">{tool.tagline}</p>
                      </div>
                      <StarRating count={tool.stars} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="font-semibold text-emerald-400 mb-2">✓ Pros</p>
                        <ul className="space-y-1">
                          {tool.pros.map((pro) => (
                            <li key={pro} className="flex gap-2"><span className="text-emerald-400 shrink-0">+</span>{pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-red-400 mb-2">✗ Cons</p>
                        <ul className="space-y-1">
                          {tool.cons.map((con) => (
                            <li key={con} className="flex gap-2"><span className="text-red-400 shrink-0">−</span>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <p className="text-sm italic border-t border-white/10 pt-4 mb-4">{tool.verdict}</p>

                    {tool.link.startsWith('/') ? (
                      <Link
                        href={tool.link}
                        aria-label={`Try ${tool.name} for free`}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm font-semibold transition-all"
                      >
                        Try {tool.name} Free <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    ) : (
                      <a
                        href={tool.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${tool.name} website (opens in new tab)`}
                        className="inline-flex items-center gap-2 px-5 py-2 border border-white/20 hover:bg-white/5 rounded-full text-sm font-semibold transition-all"
                      >
                        Visit {tool.name} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="which-to-choose">
              <h2 id="which-to-choose" className="text-2xl font-bold text-text-main mb-4">Which Free PDF Tool Should You Use?</h2>
              <p>Here&apos;s the short answer:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li><strong className="text-text-main">For editing, annotating, or signing PDFs</strong> → Use <Link href="/editor" className="text-indigo-400 hover:text-indigo-300 underline">PDF Master</Link> (free, private, no limits)</li>
                <li><strong className="text-text-main">For converting PDF to Word or Excel</strong> → Smallpdf or ILovePDF (files go to their servers)</li>
                <li><strong className="text-text-main">For merging or splitting multiple PDFs</strong> → ILovePDF</li>
                <li><strong className="text-text-main">For OCR on scanned PDFs</strong> → Adobe Acrobat free tier or Google Drive (open PDF → right-click → Open with Google Docs)</li>
              </ul>
            </section>

            <section aria-labelledby="privacy">
              <h2 id="privacy" className="text-2xl font-bold text-text-main mb-4">A Note on PDF Privacy in 2026</h2>
              <p>
                Most free PDF tools are cloud-based — your file gets uploaded to their servers for processing.
                For non-sensitive documents like event flyers or recipes, this is fine.
                But for <strong className="text-text-main">contracts, financial documents, medical records, or anything confidential</strong>, you should use a tool that processes your PDF locally.
              </p>
              <p className="mt-3">
                PDF Master is one of very few free tools that processes everything <strong className="text-text-main">entirely in your browser</strong> using JavaScript and WebAssembly.
                Your file is never sent anywhere — it stays on your device from open to download.
              </p>
            </section>

            <section aria-labelledby="faq-tools">
              <h2 id="faq-tools" className="text-2xl font-bold text-text-main mb-4">Frequently Asked Questions</h2>

              <h3 className="text-xl font-semibold text-text-main mb-2">Is there a truly free PDF editor with no watermarks?</h3>
              <p className="mb-4">Yes — PDF Master adds no watermarks and has no limits. It&apos;s 100% free for all features.</p>

              <h3 className="text-xl font-semibold text-text-main mb-2">Can I edit a PDF for free on mobile?</h3>
              <p className="mb-4">PDF Master works on mobile browsers. For iOS, the best experience is in Safari or Chrome. For Android, Chrome works great.</p>

              <h3 className="text-xl font-semibold text-text-main mb-2">What&apos;s the best free alternative to Adobe Acrobat?</h3>
              <p className="mb-4">For editing and signing, PDF Master is the best free alternative. It covers the most-used 20% of Acrobat&apos;s features that handle 80% of people&apos;s PDF needs — at zero cost.</p>

              <h3 className="text-xl font-semibold text-text-main mb-2">Is Smallpdf actually free?</h3>
              <p>Smallpdf has a free tier, but it&apos;s limited to 2 free tasks per day with a required account sign-in. The paid plan starts at $9/month. It&apos;s useful for occasional conversions but not as a daily tool.</p>
            </section>

            {/* Conclusion CTA */}
            <div className="p-6 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-center mt-8">
              <h2 className="text-xl font-bold text-text-main mb-2">Start Editing PDFs Free Today</h2>
              <p className="text-sm mb-5">
                PDF Master — the best free online PDF editor for editing, signing, and annotating.
                No account, no watermarks, no upload to servers.
              </p>
              <Link
                href="/editor"
                aria-label="Open the free PDF editor"
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-semibold transition-all hover:scale-105"
              >
                Open PDF Master Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>

        {/* Related posts */}
        <nav aria-label="Related articles" className="mt-16 pt-10 border-t border-white/10">
          <h2 className="text-xl font-bold mb-6">Related Guides</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/blog/how-to-edit-pdf-online-free" className="p-5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all group">
              <p className="text-xs text-indigo-400 mb-1 font-medium">Tutorial</p>
              <p className="font-semibold group-hover:text-indigo-400 transition-colors">How to Edit a PDF Online for Free →</p>
            </Link>
            <Link href="/blog/sign-pdf-without-software" className="p-5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all group">
              <p className="text-xs text-indigo-400 mb-1 font-medium">Guide</p>
              <p className="font-semibold group-hover:text-indigo-400 transition-colors">How to Sign a PDF Without Installing Software →</p>
            </Link>
          </div>
        </nav>
      </main>

      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-text-muted">
          <p>© {new Date().getFullYear()} PDF Master. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
