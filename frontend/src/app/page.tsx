import Link from 'next/link';
import { ArrowRight, FileText, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text-main selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-blue-500/10 blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 py-12 md:py-24 relative z-10">
          <nav className="flex justify-between items-center mb-16">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              PDF Master
            </div>
            <Link href="/editor" className="px-6 py-2.5 rounded-full bg-sidebar/10 hover:bg-sidebar/20 backdrop-blur-sm transition-all border border-white/10">
              Launch Editor
            </Link>
          </nav>

          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Edit PDFs with <span className="text-indigo-400">Superpowers</span>
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              The most advanced, secure, and beautiful PDF editor on the web.
              Sign, annotate, and modify documents directly in your browser.
            </p>

            <div className="flex justify-center gap-4 pt-8">
              <Link
                href="/editor"
                className="group relative px-8 py-4 bg-indigo-600 rounded-full font-semibold overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Editing Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Client-side processing ensures zero latency editing." },
            { icon: Shield, title: "Secure by Design", desc: "Your files never leave your browser for basic edits." },
            { icon: FileText, title: "Full Suite", desc: "Text, ink, signatures, images - all in one place." }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-2xl bg-sidebar/5 border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm">
              <feature.icon className="w-12 h-12 text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
