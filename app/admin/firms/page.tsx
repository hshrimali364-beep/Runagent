'use client'
import { useState, useEffect, useCallback } from 'react'
import { PLANS } from '@/lib/utils'

interface Firm {
  id: string; firm_name: string; owner_name: string; email: string
  plan_id: string; used_credits: number; total_credits: number; is_active: boolean; created_at: string
}

export default function AdminFirmsPage() {
  const [firms, setFirms] = useState<Firm[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const getSecret = () => document.cookie.match(/admin_session=([^;]+)/)?.[1] || ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/firms', { headers: { 'x-admin-secret': getSecret() } })
    const data = await res.json()
    setFirms(data.firms || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const act = async (firmId: string, action: string, extra?: Record<string, unknown>) => {
    setActing(firmId)
    await fetch('/api/admin/firms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': getSecret() },
      body: JSON.stringify({ action, firm_id: firmId, ...extra }),
    })
    showToast(`Firm ${action}d`)
    load()
    setActing(null)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">{toast}</div>}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CA Firms</h1>
        <p className="text-gray-500 text-sm mt-1">{firms.length} firms registered</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading firms…</div>
        ) : !firms.length ? (
          <div className="text-center py-20 text-gray-400">No firms yet. Approve access requests first.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left">Firm</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Credits</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {firms.map(f => {
                const pct = f.total_credits > 0 ? Math.round((f.used_credits / f.total_credits) * 100) : 0
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{f.firm_name}</div>
                      <div className="text-xs text-gray-500">{f.owner_name}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{f.email}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium capitalize">{f.plan_id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-gray-700 mb-1">{f.used_credits}/{f.total_credits} ({pct}%)</div>
                      <div className="h-1.5 bg-gray-100 rounded-full w-24 overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {f.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {f.is_active ? (
                          <button onClick={() => act(f.id, 'suspend')} disabled={acting === f.id}
                            className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg hover:bg-amber-200 disabled:opacity-50 font-medium transition-colors">
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => act(f.id, 'activate')} disabled={acting === f.id}
                            className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200 disabled:opacity-50 font-medium transition-colors">
                            Activate
                          </button>
                        )}
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none"
                          defaultValue=""
                          onChange={e => {
                            const planId = e.target.value
                            if (!planId) return
                            const credits = PLANS[planId as keyof typeof PLANS]?.credits || 50
                            act(f.id, 'upgrade', { plan_id: planId, credits })
                            e.target.value = ''
                          }}
                        >
                          <option value="">Change plan…</option>
                          {Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
