import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
            </div>
            <span className="font-bold text-lg tracking-tight">Run<span className="text-blue-600">Agent</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <Link href="/features" className="hover:text-black transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-black transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-black transition-colors font-medium">Sign In</Link>
            <Link href="/request-access" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Request Access</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            Built for Indian CA Firms
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
            From Bill Photos to<br />
            <span className="text-blue-600">Ready Accounting Data</span><br />
            in Minutes
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Collect bills from clients via WhatsApp, extract invoice data automatically using AI-powered OCR, and export to Excel or Tally in one smooth workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/request-access" className="bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-0.5 hover:shadow-lg text-base">
              Request Access — Free
            </Link>
            <Link href="/pricing" className="bg-white text-gray-900 font-semibold px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all text-base">
              View Pricing
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-gray-500">
            {['No technical setup needed','Works via WhatsApp link','GST-ready OCR extraction','Tally & Excel export'].map(t => (
              <span key={t} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm mb-3 uppercase tracking-wider">Core Features</p>
            <h2 className="text-4xl font-bold text-gray-900">Everything a CA firm needs</h2>
            <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">A complete bill-to-data pipeline built for how Indian CA firms actually work.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📱', title: 'WhatsApp-First Collection', desc: 'Generate secure upload links per client. Share on WhatsApp — no app install required for clients.' },
              { icon: '🤖', title: 'AI-Powered OCR', desc: 'Extracts Invoice No., Date, Vendor, GSTIN, HSN, CGST, SGST, IGST, Total automatically from every bill.' },
              { icon: '📊', title: 'Excel & Tally Export', desc: 'Export to .xlsx, .csv, or Tally XML with date range and client filters. One-click accounting.' },
              { icon: '👥', title: 'Multi-Client Management', desc: 'Manage all clients in one place. Individual upload links, bill limits, and activity tracking.' },
              { icon: '💳', title: 'Credit-Based Billing', desc: 'Pay per bill processed. Track usage in real-time, get warned at 80%, upgrade instantly via Razorpay.' },
              { icon: '🔒', title: 'Bank-Level Security', desc: 'Signed tokens, expiry dates, role-based access, server-side API keys, encrypted Supabase storage.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-600 font-semibold text-sm mb-3 uppercase tracking-wider">The Workflow</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-16">Four steps from photo to data</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: '1', title: 'Add Client', desc: 'Add client in RunAgent, generate their secure upload link instantly.' },
              { n: '2', title: 'Share on WhatsApp', desc: 'Client receives the link, taps it, and photographs their bills.' },
              { n: '3', title: 'OCR Processes', desc: 'AI extracts all GST fields automatically within seconds.' },
              { n: '4', title: 'Export & Done', desc: 'Review, approve, export to Excel or Tally. Accounting ready.' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mx-auto mb-4">{s.n}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-blue-600 font-semibold text-sm mb-3 uppercase tracking-wider">Pricing</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-500 mb-12 text-lg">Start free with 50 bill credits. Scale as you grow.</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { name:'Free Trial', price:'₹0', bills:'50 bills', cta:'Get Started' },
              { name:'Starter', price:'₹999/mo', bills:'300 bills', cta:'Request Access' },
              { name:'Growth', price:'₹1,999/mo', bills:'800 bills', cta:'Request Access', popular: true },
              { name:'Pro', price:'₹2,999/mo', bills:'1,500 bills', cta:'Request Access' },
              { name:'Firm', price:'₹4,999/mo', bills:'3,000 bills', cta:'Contact Us' },
            ].map(p => (
              <div key={p.name} className={`bg-white rounded-2xl p-6 border-2 text-left ${p.popular ? 'border-blue-600 shadow-lg shadow-blue-100' : 'border-gray-100'} relative`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>}
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{p.name}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{p.price}</div>
                <div className="text-sm text-gray-500 mb-4">{p.bills}/month</div>
                <Link href="/request-access" className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${p.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-6">Extra bills: <strong className="text-gray-600">₹3/bill</strong> beyond your plan limit. Powered by Razorpay.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gray-900 rounded-3xl p-16 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to transform your billing workflow?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join CA firms saving hours every month with RunAgent.</p>
          <Link href="/request-access" className="bg-white text-gray-900 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors text-base">
            Request Access — It&apos;s Free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold text-lg">Run<span className="text-blue-600">Agent</span></div>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link href="/features" className="hover:text-black transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-black transition-colors">Contact</Link>
            <Link href="/request-access" className="hover:text-black transition-colors">Request Access</Link>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} RunAgent · Made in India 🇮🇳</p>
        </div>
      </footer>
    </div>
  )
}
