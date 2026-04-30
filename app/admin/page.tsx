import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const admin = createAdminClient()

  const [firmsRes, requestsRes, invoicesRes, paymentsRes] = await Promise.all([
    admin.from('firms').select('id, plan_id, is_active'),
    admin.from('access_requests').select('id, status, full_name, firm_name, email, city, monthly_volume, created_at').order('created_at', { ascending: false }).limit(10),
    admin.from('invoices').select('id', { count: 'exact', head: true }),
    admin.from('payments').select('amount, status'),
  ])

  const firms = firmsRes.data || []
  const requests = requestsRes.data || []
  const revenue = (paymentsRes.data || []).filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pending = requests.filter(r => r.status === 'pending')

  const stats = [
    { label: 'Total CA Firms', value: firms.length, color: 'blue', href: '/admin/firms' },
    { label: 'Active Firms', value: firms.filter(f => f.is_active).length, color: 'green', href: '/admin/firms' },
    { label: 'Pending Requests', value: pending.length, color: 'amber', href: '/admin/requests' },
    { label: 'Total Bills Processed', value: invoicesRes.count || 0, color: 'gray', href: '/admin/firms' },
    { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, color: 'green', href: '/admin/revenue' },
  ]

  const STATUS_STYLE: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">RunAgent platform overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="text-xs text-gray-500 font-medium mb-2 leading-snug">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Access Requests</h2>
          <Link href="/admin/requests" className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
        </div>
        {!requests.length ? (
          <div className="text-center py-12 text-gray-400">No requests yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left">Name / Firm</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">City</th>
                <th className="px-5 py-3 text-left">Volume</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{r.full_name}</div>
                    <div className="text-xs text-gray-400">{r.firm_name}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{r.email}</td>
                  <td className="px-5 py-3 text-gray-500">{r.city}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{r.monthly_volume}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {r.status === 'pending' && (
                      <Link href="/admin/requests" className="text-xs text-blue-600 hover:underline font-medium">Review →</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
