import { createAdminClient } from '@/lib/supabase/server'

export default async function AdminRevenuePage() {
  const admin = createAdminClient()

  const [firmsRes, paymentsRes, invoicesRes] = await Promise.all([
    admin.from('firms').select('plan_id, is_active'),
    admin.from('payments').select('*').order('created_at', { ascending: false }),
    admin.from('invoices').select('id', { count: 'exact', head: true }),
  ])

  const payments = paymentsRes.data || []
  const firms = firmsRes.data || []

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const planCounts: Record<string, number> = {}
  firms.forEach(f => { planCounts[f.plan_id] = (planCounts[f.plan_id] || 0) + 1 })

  const planRevenue: Record<string, number> = {
    free: 0, starter: 999, growth: 1999, pro: 2999, firm: 4999
  }

  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
    { label: 'Total Firms', value: firms.length },
    { label: 'Active Firms', value: firms.filter(f => f.is_active).length },
    { label: 'Total Bills Processed', value: invoicesRes.count || 0 },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <p className="text-gray-500 text-sm mt-1">Platform financial overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="text-xs text-gray-500 font-medium mb-2">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Plan Distribution</h2>
        <div className="space-y-3">
          {['free','starter','growth','pro','firm'].map(planId => {
            const count = planCounts[planId] || 0
            const rev = count * planRevenue[planId]
            const maxCount = Math.max(...Object.values(planCounts), 1)
            return (
              <div key={planId} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-gray-700 capitalize">{planId}</div>
                <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <div className="h-full bg-blue-500 rounded-lg transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <div className="w-16 text-sm text-gray-700 font-semibold text-right">{count} firms</div>
                <div className="w-24 text-xs text-gray-500 text-right">₹{rev.toLocaleString('en-IN')}/mo</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Payment History</h2>
        </div>
        {!payments.length ? (
          <div className="text-center py-12 text-gray-400">No payments yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left">Payment ID</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.razorpay_payment_id || p.id.slice(0, 12) + '…'}</td>
                  <td className="px-5 py-3 capitalize font-medium text-gray-700">{p.plan_id}</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
