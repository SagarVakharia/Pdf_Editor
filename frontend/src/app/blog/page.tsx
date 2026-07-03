import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PDF Guides & Tutorials',
  description:
    'Free guides on how to edit, sign, annotate, and manage PDF documents online — no software required.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'PDF Guides & Tutorials | PDF Master',
    description:
      'Learn how to edit, sign, and manage PDFs online for free. No software to install.',
    url: 'https://pdf-editor-f1av.vercel.app/blog',
  },
};

const posts = [
  {
    slug: 'how-to-edit-pdf-online-free',
    title: 'How to Edit a PDF Online for Free',
    description:
      'A complete step-by-step guide to editing PDF documents directly in your browser — no Adobe Acrobat needed.',
    date: 'July 1, 2026',
    readTime: '5 min read',
    tag: 'Tutorial',
  },
  {
    slug: 'sign-pdf-without-software',
    title: 'How to Sign a PDF Without Installing Software',
    description:
      'Learn how to add a legally-binding digital signature to any PDF using only your web browser — for free.',
    date: 'July 1, 2026',
    readTime: '4 min read',
    tag: 'Guide',
  },
  {
    slug: 'best-free-pdf-tools-2026',
    title: 'Best Free PDF Tools in 2026',
    description:
      'A comparison of the best free online PDF editors, converters, and signing tools available in 2026.',
    date: 'July 1, 2026',
    readTime: '6 min read',
    tag: 'Review',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-text-main">
      {/* Header */}
      <header className="border-b border-white/10 py-5 px-4 sm:px-6">
        <nav aria-label="Site navigation" className="container mx-auto flex justify-between items-center">
          <Link href="/" aria-label="PDF Master home" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            PDF Master
          </Link>
          <Link
            href="/editor"
            aria-label="Open the free PDF editor"
            className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
          >
            Open Editor
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12 md:py-20 max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-muted">
          <ol className="flex items-center gap-2 list-none">
            <li><Link href="/" className="hover:text-indigo-400 transition-colors">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text-main">Blog</li>
          </ol>
        </nav>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          PDF Guides &amp; Tutorials
        </h1>
        <p className="text-text-muted text-lg mb-12 max-w-2xl">
          Free, practical guides to help you edit, sign, and manage PDFs online —
          no software installation required.
        </p>

        {/* Post List */}
        <div className="grid gap-6" role="list" aria-label="Blog posts">
          {posts.map((post) => (
            <article
              key={post.slug}
              role="listitem"
              className="group p-6 md:p-8 rounded-2xl bg-sidebar/5 border border-white/10 hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3 text-sm text-text-muted">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">
                  {post.tag}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {post.date}
                </span>
                <span>{post.readTime}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="text-text-muted mb-4">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                aria-label={`Read: ${post.title}`}
                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
              >
                Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Edit Your PDF?</h2>
          <p className="text-text-muted mb-6">
            No reading required — just open PDF Master and start editing for free.
          </p>
          <Link
            href="/editor"
            aria-label="Open the free PDF editor"
            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-semibold transition-all hover:scale-105"
          >
            Open Free PDF Editor <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-text-muted">
          <p>© {new Date().getFullYear()} PDF Master. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
