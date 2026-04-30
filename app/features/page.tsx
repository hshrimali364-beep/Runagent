import Link from 'next/link'

const features = [
  {
    icon: '📱', title: 'WhatsApp-First Bill Collection',
    desc: 'Generate unique secure upload links per client. Share via WhatsApp with one tap. Clients upload bill photos directly from their phone — no app, no login required.',
    bullets: ['One-click link generation per client','Pre-filled WhatsApp message template','Works on any smartphone browser','Optional bill upload limit per client'],
  },
  {
    icon: '🤖', title: 'AI-Powered OCR Engine',
    desc: 'Every bill is optimized with Sharp (auto-rotate, resize, compress) then sent to OCR.space for accurate extraction. Supports JPG, PNG, and PDF up to 3 pages.',
    bullets: ['Invoice No., Date, Vendor Name extraction','GSTIN pattern recognition','HSN code detection','CGST, SGST, IGST, Total breakdown','Confidence score per extraction'],
  },
  {
    icon: '📄', title: 'Invoice Management',
    desc: 'A full-featured invoice table. Review OCR results, correct any errors, approve or reject invoices, and track every bill from upload to export.',
    bullets: ['Inline field editing','Approve / Reject / Delete actions','Full-text search across all fields','Filter by status, client, date range'],
  },
  {
    icon: '📊', title: 'Export to Excel & Tally',
    desc: 'Export approved invoices to Excel (.xlsx), CSV, or Tally XML with one click. Apply date range and client filters before exporting.',
    bullets: ['Excel .xlsx with summary sheet','CSV for any software','Tally ERP / Prime XML import','Filtered by date, client, status'],
  },
  {
    icon: '💳', title: 'Credit-Based Billing',
    desc: 'Each bill processed uses one credit from your monthly plan. Real-time usage tracking with warnings at 80% and upgrade prompts at 100%.',
    bullets: ['Real-time credit dashboard','80% usage warning','Upgrade via Razorpay — UPI, Cards, Net Banking','Extra bills at ₹3/bill'],
  },
  {
    icon: '🔒', title: 'Bank-Level Security',
    desc: 'Built on Supabase with signed upload tokens, row-level security, and server-side API keys. Your clients\' data is encrypted and isolated per firm.',
    bullets: ['Signed, expiring upload tokens','Role-based access control','Server-side OCR & API keys','File type validation & rate limiting'],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="font-bold text-xl">Run<span className="text-blue-600">Agent</span></Link>
        <div className="flex gap-6 text-sm text-gray-600">
          <Link href="/pricing" className="hover:text-black">Pricing</Link>
          <Link href="/contact" className="hover:text-black">Contact</Link>
          <Link href="/request-access" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Request Access</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Platform Features</h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">Everything built around how Indian CA firms actually work.</p>
        </div>

        <div className="space-y-6">
          {features.map((f, i) => (
            <div key={f.title} className={`flex gap-12 items-start p-8 rounded-2xl border border-gray-100 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="text-5xl flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h2>
                <p className="text-gray-500 leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"/>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/request-access" className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors text-base">
            Get Started — Free →
          </Link>
        </div>
      </div>
    </div>
  )
}
