import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import JsonLd, { articleSchema, breadcrumbSchema } from '@/components/JsonLd';

const POST = {
  title: 'How to Sign a PDF Without Installing Software (Free, 2026)',
  description:
    'Add a digital or handwritten signature to any PDF directly in your browser — no Adobe Acrobat, no apps to install, completely free.',
  url: 'https://pdf-editor-f1av.vercel.app/blog/sign-pdf-without-software',
  datePublished: '2026-07-01',
};

export const metadata: Metadata = {
  title: POST.title,
  description: POST.description,
  alternates: { canonical: '/blog/sign-pdf-without-software' },
  openGraph: {
    title: POST.title,
    description: POST.description,
    url: POST.url,
    type: 'article',
  },
};

export default function SignPdfPage() {
  return (
    <div className="min-h-screen bg-background text-text-main">
      <JsonLd data={articleSchema({ title: POST.title, description: POST.description, url: POST.url, datePublished: POST.datePublished })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: 'https://pdf-editor-f1av.vercel.app' },
        { name: 'Blog', url: 'https://pdf-editor-f1av.vercel.app/blog' },
        { name: 'How to Sign a PDF Without Installing Software', url: POST.url },
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
            <li aria-current="page" className="text-text-main truncate">Sign a PDF Without Software</li>
          </ol>
        </nav>

        <article>
          <header>
            <div className="flex items-center gap-3 mb-4 text-sm text-text-muted">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Guide</span>
              <time dateTime={POST.datePublished}>July 1, 2026</time>
              <span>4 min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              How to Sign a PDF Without Installing Software
            </h1>
            <p className="text-lg text-text-muted mb-8 leading-relaxed">
              Need to sign a PDF contract, form, or agreement? You don&apos;t need Adobe Acrobat — or any software at all.
              With PDF Master, you can <strong className="text-text-main">sign any PDF in seconds, free, right in your browser.</strong>
            </p>

            {/* Inline CTA */}
            <div className="p-5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-sm font-medium flex-1">Sign your PDF now — no account, no download, 100% free.</p>
              <Link
                href="/editor"
                aria-label="Open the PDF signer now"
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm font-semibold transition-all"
              >
                Sign PDF Free <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <div className="space-y-8 text-text-muted leading-relaxed">

            <section aria-labelledby="types-of-signatures">
              <h2 id="types-of-signatures" className="text-2xl font-bold text-text-main mb-4">Types of PDF Signatures</h2>
              <p>
                There are a few different types of PDF signatures, and it&apos;s important to understand which one you need:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li>
                  <strong className="text-text-main">Electronic signature</strong> — An image of your handwritten signature placed on a PDF.
                  This is what most people mean when they say "sign a PDF online." It&apos;s legally valid for most business and personal documents.
                </li>
                <li>
                  <strong className="text-text-main">Digital certificate signature</strong> — A cryptographic signature embedded in the PDF file, tied to a certificate authority.
                  Required for some legal and government documents. PDF Master handles electronic signatures.
                </li>
                <li>
                  <strong className="text-text-main">Typed signature</strong> — Your name typed in a handwriting font. Quick, clean, and perfectly acceptable for most documents.
                </li>
              </ul>
            </section>

            <section aria-labelledby="step-by-step-sign">
              <h2 id="step-by-step-sign" className="text-2xl font-bold text-text-main mb-4">How to Sign a PDF Online — Step by Step</h2>

              <h3 className="text-xl font-semibold text-text-main mb-3">Step 1: Open PDF Master</h3>
              <p>
                Go to the <Link href="/editor" className="text-indigo-400 hover:text-indigo-300 underline">PDF Master editor</Link>.
                No sign-up required — the tool loads immediately.
              </p>

              <h3 className="text-xl font-semibold text-text-main mb-3 mt-6">Step 2: Upload the PDF You Need to Sign</h3>
              <p>
                Drag and drop your PDF into the upload area, or click to browse your files.
                You can also paste a PDF URL if the document is hosted online.
                Your file stays on your device — it is not uploaded to any server.
              </p>

              <h3 className="text-xl font-semibold text-text-main mb-3 mt-6">Step 3: Click the Sign Tool</h3>
              <p>
                In the toolbar, click the <strong className="text-text-main">Sign</strong> icon (pen nib).
                A signature panel will appear with two tabs:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li>
                  <strong className="text-text-main">Draw</strong> — Use your mouse, trackpad, or touchscreen to draw your signature freehand.
                  Choose your pen colour (black, blue, green, or red) and line thickness.
                </li>
                <li>
                  <strong className="text-text-main">Type</strong> — Type your name and choose from three handwriting fonts: Script, Stylish, or Casual.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-text-main mb-3 mt-6">Step 4: Place Your Signature on the PDF</h3>
              <p>
                After clicking <strong className="text-text-main">Save Signature</strong>, click anywhere on the PDF page to stamp your signature.
                You can then drag it to exactly the right position, and resize it using the handles.
              </p>

              <h3 className="text-xl font-semibold text-text-main mb-3 mt-6">Step 5: Download the Signed PDF</h3>
              <p>
                Click the <strong className="text-text-main">Download</strong> button.
                Your signed PDF downloads instantly — ready to email, print, or share.
              </p>
            </section>

            <section aria-labelledby="legal">
              <h2 id="legal" className="text-2xl font-bold text-text-main mb-4">Are Online PDF Signatures Legally Binding?</h2>
              <p>
                In most countries, yes. Electronic signatures are legally recognised under:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li><strong className="text-text-main">ESIGN Act</strong> (United States) — electronic signatures have the same legal weight as handwritten signatures</li>
                <li><strong className="text-text-main">eIDAS Regulation</strong> (European Union) — recognises electronic signatures across all member states</li>
                <li><strong className="text-text-main">Electronic Transactions Act</strong> (Australia, Canada, and others)</li>
              </ul>
              <p className="mt-3">
                However, some documents — such as wills, notarised deeds, or certain court filings — may require a wet (physical) signature or a certified digital certificate. Check your jurisdiction&apos;s requirements for sensitive legal documents.
              </p>
            </section>

            <section aria-labelledby="tips-sign">
              <h2 id="tips-sign" className="text-2xl font-bold text-text-main mb-4">Tips for a Professional-Looking Signature</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use a <strong className="text-text-main">black or dark blue</strong> pen colour for the most professional look</li>
                <li>If drawing, use a trackpad or stylus for a smoother result than a mouse</li>
                <li>The <strong className="text-text-main">Script</strong> typed font closely mimics a hand-signed signature and works great for formal documents</li>
                <li>Position your signature in the designated signature box — most contracts have one near the bottom</li>
                <li>If you need to sign multiple pages, use the Sign tool on each page separately</li>
              </ul>
            </section>

            <section aria-labelledby="faq-sign">
              <h2 id="faq-sign" className="text-2xl font-bold text-text-main mb-4">Frequently Asked Questions</h2>

              <h3 className="text-xl font-semibold text-text-main mb-2">Do I need to create an account to sign a PDF?</h3>
              <p className="mb-4">No. PDF Master requires zero account creation. Open the editor, upload your PDF, sign, and download — that&apos;s it.</p>

              <h3 className="text-xl font-semibold text-text-main mb-2">Is my signature saved anywhere?</h3>
              <p className="mb-4">No. Your signature data lives only in your browser tab for the current session. Once you close the tab, it&apos;s gone. Nothing is stored on any server.</p>

              <h3 className="text-xl font-semibold text-text-main mb-2">Can I sign on mobile?</h3>
              <p className="mb-4">Yes. PDF Master is fully responsive and works on iOS and Android browsers. Drawing a signature with your finger works well on a touchscreen.</p>

              <h3 className="text-xl font-semibold text-text-main mb-2">What if I need to sign multiple documents?</h3>
              <p>No problem — you can upload and sign as many PDFs as you need. There are no daily limits.</p>
            </section>

            {/* Conclusion CTA */}
            <div className="p-6 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-center mt-8">
              <h2 className="text-xl font-bold text-text-main mb-2">Sign Your PDF Now — Free</h2>
              <p className="text-sm mb-5">
                No software, no account, no cost. Open PDF Master and sign your document in under a minute.
              </p>
              <Link
                href="/editor"
                aria-label="Open the free PDF signer"
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-semibold transition-all hover:scale-105"
              >
                Sign PDF Free <ArrowRight className="w-5 h-5" aria-hidden="true" />
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
            <Link href="/blog/best-free-pdf-tools-2026" className="p-5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all group">
              <p className="text-xs text-indigo-400 mb-1 font-medium">Review</p>
              <p className="font-semibold group-hover:text-indigo-400 transition-colors">Best Free PDF Tools in 2026 →</p>
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
