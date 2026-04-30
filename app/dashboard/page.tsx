import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatINR, timeAgo, creditPercent } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: firm } = await supabase.from('firms').select('*').eq('user_id', user.id).single()
  if (!firm) redirect('/login')

  const [clientsRes, billsRes, pendingRes, recentRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id).eq('is_active', true),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id).eq('status', 'pending'),
    supabase.from('invoices').select('*, client:clients(name)').eq('firm_id', firm.id).order('created_at', { ascending: false }).limit(5),
  ])

  const pct = creditPercent(firm.used_credits, firm.total_credits)
  const stats = [
    { label: 'Total Clients',  value: clientsRes.count ?? 0, href: '/dashboard/clients' },
    { label: 'Bills Uploaded', value: billsRes.count   ?? 0, href: '/dashboard/invoices' },
    { label: 'Pending Review', value: pendingRes.count ?? 0, href: '/dashboard/invoices?status=pending' },
    { label: 'Credits Left',   value: firm.total_credits - firm.used_credits, href: '/dashboard/billing' },
  ]

  const statusStyle: Record<string, string> = {
    approved: 'bg-green-50 text-green-700 border border-green-100',
    pending:  'bg-amber-50 text-amber-700 border border-amber-100',
    rejected: 'bg-red-50 text-red-700 border border-red-100',
    review:   'bg-blue-50 text-blue-700 border border-blue-100',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, {firm.owner_name || firm.firm_name}</p>
      </div>

      {/* Credits */}
      {pct >= 70 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Credit limit approaching</p>
            <p className="text-xs text-amber-600 mt-0.5">{firm.used_credits} of {firm.total_credits} credits used ({pct}%)</p>
          </div>
          <Link href="/dashboard/billing" className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">Upgrade Plan</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Credits bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Bill Credits</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{firm.plan_id} plan · {firm.total_credits - firm.used_credits} remaining</p>
          </div>
          <Link href="/dashboard/billing" className="text-xs font-medium text-blue-600 hover:text-blue-700">Upgrade</Link>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{firm.used_credits} used</span>
          <span>{firm.total_credits} total</span>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
          <Link href="/dashboard/invoices" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</Link>
        </div>
        {!recentRes.data?.length ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No invoices yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Add a client and share their upload link</p>
            <Link href="/dashboard/clients" className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Add First Client</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Invoice #', 'Vendor', 'Client', 'Amount', 'Status', 'Uploaded'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRes.data.map((inv: Record<string, unknown>) => (
                  <tr key={inv.id as string} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{(inv.invoice_number as string) || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{(inv.vendor_name as string) || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{(inv.client as Record<string,string>)?.name || '—'}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{formatINR(inv.total_amount as number)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusStyle[inv.status as string] || 'bg-gray-50 text-gray-600'}`}>
                        {inv.status as string}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{timeAgo(inv.created_at as string)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
