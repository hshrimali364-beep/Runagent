import Link from 'next/link'

const plans = [
  { id:'free', name:'Free Trial', price:0, bills:50, period:'one-time', features:['OCR extraction','WhatsApp upload links','Excel export','Up to 5 clients'], cta:'Get Started', popular:false },
  { id:'starter', name:'Starter', price:999, bills:300, period:'month', features:['Everything in Free','Tally XML export','Priority OCR queue','Up to 20 clients','Email support'], cta:'Request Access', popular:false },
  { id:'growth', name:'Growth', price:1999, bills:800, period:'month', features:['Everything in Starter','CSV export','Advanced date filters','Unlimited clients','Usage analytics'], cta:'Request Access', popular:true },
  { id:'pro', name:'Pro', price:2999, bills:1500, period:'month', features:['Everything in Growth','REST API access','Webhooks','2 team members','Priority phone support'], cta:'Request Access', popular:false },
  { id:'firm', name:'Firm', price:4999, bills:3000, period:'month', features:['Everything in Pro','5 team members','Custom branding','SLA guarantee','Dedicated account manager'], cta:'Contact Sales', popular:false },
]

const compare = [
  { feature:'Monthly bill credits', free:'50 (one-time)', starter:'300', growth:'800', pro:'1,500', firm:'3,000' },
  { feature:'Extra bill cost', free:'₹3/bill', starter:'₹3/bill', growth:'₹3/bill', pro:'₹2.5/bill', firm:'₹2/bill' },
  { feature:'OCR extraction', free:'✓', starter:'✓', growth:'✓', pro:'✓', firm:'✓' },
  { feature:'Excel export', free:'✓', starter:'✓', growth:'✓', pro:'✓', firm:'✓' },
  { feature:'Tally XML export', free:'—', starter:'✓', growth:'✓', pro:'✓', firm:'✓' },
  { feature:'CSV export', free:'—', starter:'—', growth:'✓', pro:'✓', firm:'✓' },
  { feature:'Team members', free:'1', starter:'1', growth:'1', pro:'2', firm:'5' },
  { feature:'API access', free:'—', starter:'—', growth:'—', pro:'✓', firm:'✓' },
  { feature:'Custom branding', free:'—', starter:'—', growth:'—', pro:'—', firm:'✓' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="font-bold text-xl">Run<span className="text-blue-600">Agent</span></Link>
        <div className="flex gap-6 text-sm text-gray-600">
          <Link href="/features" className="hover:text-black">Features</Link>
          <Link href="/contact" className="hover:text-black">Contact</Link>
          <Link href="/request-access" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Request Access</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-500">Start free. Scale as your firm grows. No hidden charges.</p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
          {plans.map(plan => (
            <div key={plan.id} className={`rounded-2xl p-6 border-2 relative ${plan.popular ? 'border-blue-500 shadow-xl shadow-blue-100' : 'border-gray-100'}`}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{plan.name}</div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">
                {plan.price === 0 ? '₹0' : `₹${plan.price.toLocaleString('en-IN')}`}
                {plan.price > 0 && <span className="text-sm font-normal text-gray-400">/mo</span>}
              </div>
              <div className="text-sm text-gray-500 mb-4">
                <strong className="text-gray-800">{plan.bills.toLocaleString('en-IN')} bills</strong>
                {plan.period === 'month' ? '/month' : ' one-time'}
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/request-access"
                className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mb-16">
          Extra bills beyond plan limit: <strong className="text-gray-800">₹3/bill</strong> · Payments via Razorpay — UPI, Cards, Net Banking
        </p>

        {/* Comparison table */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Full Feature Comparison</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-gray-600 font-medium">Feature</th>
                {['Free','Starter','Growth ⭐','Pro','Firm'].map(h => (
                  <th key={h} className={`px-4 py-4 text-center font-bold ${h.includes('Growth') ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {compare.map(row => (
                <tr key={row.feature} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600 font-medium">{row.feature}</td>
                  {[row.free, row.starter, row.growth, row.pro, row.firm].map((val, i) => (
                    <td key={i} className={`px-4 py-3 text-center ${i === 2 ? 'bg-blue-50' : ''} ${val === '✓' ? 'text-green-600 font-bold' : val === '—' ? 'text-gray-300' : 'text-gray-700 font-medium'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-16 bg-gray-900 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need more than 3,000 bills/month?</h2>
          <p className="text-gray-400 mb-6">We offer custom enterprise pricing for large CA networks and accounting firms.</p>
          <Link href="/contact" className="bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
            Talk to Sales →
          </Link>
        </div>
      </div>
    </div>
  )
}
