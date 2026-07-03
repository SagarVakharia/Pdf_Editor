import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, Shield, Zap, PenTool, Type, Image as ImageIcon, Download } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text-main selection:bg-indigo-500/30">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-blue-500/10 blur-3xl" aria-hidden="true" />

        <div className="container mx-auto px-4 sm:px-6 py-12 md:py-24 relative z-10">
          <nav aria-label="Main navigation" className="flex justify-between items-center mb-16">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400" aria-label="PDF Master home">
              PDF Master
            </div>
            <Link
              href="/editor"
              aria-label="Open the free PDF editor"
              className="px-6 py-2.5 rounded-full bg-sidebar/10 hover:bg-sidebar/20 backdrop-blur-sm transition-all border border-white/10"
            >
              Launch Editor
            </Link>
          </nav>

          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Primary H1 — keyword-optimised */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Free Online&nbsp;
              <span className="text-indigo-400">PDF Editor</span>
              &nbsp;— Edit, Sign &amp; Annotate PDFs
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              The most advanced, private PDF editor on the web. Sign, annotate, add text,
              and modify documents directly in your browser —{' '}
              <strong className="text-text-main">no installation, no account, 100% free.</strong>
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <Link
                href="/editor"
                id="cta-start-editing"
                aria-label="Start editing your PDF for free"
                className="group relative px-8 py-4 bg-indigo-600 rounded-full font-semibold overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Editing Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
              </Link>
              <Link
                href="/blog"
                id="cta-learn-more"
                aria-label="Read our PDF editing guides"
                className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/5 font-semibold transition-all"
              >
                PDF Guides
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="features-heading" className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
        <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
          Everything You Need to Edit PDFs — Free
        </h2>
        <p className="text-text-muted text-center max-w-xl mx-auto mb-12">
          PDF Master packs a full suite of professional tools into a clean, fast browser experience.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Zap,
              title: 'Lightning Fast',
              desc: 'Client-side processing means zero upload wait time. Your PDF renders and edits instantly.',
              ariaLabel: 'Lightning fast processing icon',
            },
            {
              icon: Shield,
              title: 'Secure & Private',
              desc: 'Your files never leave your browser for basic edits. Maximum privacy guaranteed.',
              ariaLabel: 'Security and privacy icon',
            },
            {
              icon: FileText,
              title: 'Full Edit Suite',
              desc: 'Add text, draw, insert images, stamps, and signatures — all in one place.',
              ariaLabel: 'Full editing suite icon',
            },
            {
              icon: PenTool,
              title: 'Sign PDFs Online',
              desc: 'Draw, type, or upload your signature and place it on any PDF page instantly.',
              ariaLabel: 'Sign PDF icon',
            },
            {
              icon: Type,
              title: 'Add & Edit Text',
              desc: 'Click any area of your PDF and type new text, or modify existing content.',
              ariaLabel: 'Add text to PDF icon',
            },
            {
              icon: Download,
              title: 'Download Instantly',
              desc: 'Export your edited PDF with one click. No watermarks, no subscriptions.',
              ariaLabel: 'Download PDF icon',
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="p-8 rounded-2xl bg-sidebar/5 border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm"
            >
              <feature.icon className="w-12 h-12 text-indigo-400 mb-6" aria-label={feature.ariaLabel} />
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-text-muted">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section aria-labelledby="how-it-works-heading" className="bg-sidebar/5 border-y border-white/5 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
            How to Edit a PDF Online — 3 Simple Steps
          </h2>
          <p className="text-text-muted text-center max-w-xl mx-auto mb-12">
            No software to download, no account to create. Just open, edit, and save.
          </p>

          <ol className="grid md:grid-cols-3 gap-8 list-none">
            {[
              {
                step: '01',
                title: 'Upload Your PDF',
                desc: 'Drag and drop your PDF into the editor, or click to browse for a file from your device.',
              },
              {
                step: '02',
                title: 'Edit, Sign & Annotate',
                desc: 'Use the toolbar to add text, draw, highlight, insert images, stamps, or a digital signature.',
              },
              {
                step: '03',
                title: 'Download for Free',
                desc: 'When you\'re done, click Save to download your edited PDF instantly. No watermarks.',
              },
            ].map((item) => (
              <li key={item.step} className="flex flex-col items-center text-center p-6">
                <span className="text-5xl font-black text-indigo-400/30 mb-4" aria-hidden="true">{item.step}</span>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-text-muted">{item.desc}</p>
              </li>
            ))}
          </ol>

          <div className="flex justify-center mt-12">
            <Link
              href="/editor"
              id="cta-how-it-works"
              aria-label="Open the PDF editor now"
              className="group px-10 py-4 bg-indigo-600 rounded-full font-semibold transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] flex items-center gap-2"
            >
              Open PDF Editor <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Blog CTA ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="guides-heading" className="container mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
        <h2 id="guides-heading" className="text-3xl font-bold mb-4">
          Learn PDF Editing Tips &amp; Tricks
        </h2>
        <p className="text-text-muted max-w-xl mx-auto mb-8">
          Read our free guides on how to edit, sign, and manage PDF documents without installing any software.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/blog/how-to-edit-pdf-online-free" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors">
            How to Edit a PDF Online for Free
          </Link>
          <span className="text-text-muted hidden sm:inline" aria-hidden="true">·</span>
          <Link href="/blog/sign-pdf-without-software" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors">
            Sign a PDF Without Software
          </Link>
          <span className="text-text-muted hidden sm:inline" aria-hidden="true">·</span>
          <Link href="/blog/best-free-pdf-tools-2026" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors">
            Best Free PDF Tools 2026
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>© {new Date().getFullYear()} PDF Master. All rights reserved.</p>
          <nav aria-label="Footer navigation" className="flex gap-6">
            <Link href="/editor" className="hover:text-text-main transition-colors">Editor</Link>
            <Link href="/blog" className="hover:text-text-main transition-colors">Blog</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
