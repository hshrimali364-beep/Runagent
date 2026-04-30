'use client'
import { useState, useEffect, useCallback } from 'react'

interface Request {
  id: string; full_name: string; firm_name: string; email: string
  mobile: string; city: string; monthly_volume: string; status: string; created_at: string
}

const ADMIN_SECRET = typeof window !== 'undefined' ? document.cookie.match(/admin_session=([^;]+)/)?.[1] || '' : ''

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/requests?status=${filter}`, {
      headers: { 'x-admin-secret': document.cookie.match(/admin_session=([^;]+)/)?.[1] || '' }
    })
    const data = await res.json()
    setRequests(data.requests || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const act = async (id: string, action: 'approve' | 'reject', note?: string) => {
    setActing(id)
    const res = await fetch('/api/admin/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': document.cookie.match(/admin_session=([^;]+)/)?.[1] || ''
      },
      body: JSON.stringify({ action, id, note }),
    })
    const data = await res.json()
    if (data.success) {
      showToast(data.message || `Request ${action}d successfully`)
      load()
    } else {
      showToast(`Error: ${data.error}`)
    }
    setActing(null)
  }

  const STATUS_STYLE: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-5xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">{toast}</div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Approve or reject CA firm requests</p>
        </div>
        <div className="flex gap-2">
          {['pending','approved','rejected','all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading requests…</div>
        ) : !requests.length ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-gray-600">No {filter} requests</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left">Firm / Person</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">City</th>
                <th className="px-5 py-3 text-left">Volume</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">{r.firm_name}</div>
                    <div className="text-xs text-gray-500">{r.full_name}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-gray-700 text-xs">{r.email}</div>
                    <div className="text-gray-500 text-xs">{r.mobile}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{r.city}</td>
                  <td className="px-5 py-4 text-gray-600 text-xs">{r.monthly_volume}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {new Date(r.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => act(r.id, 'approve')}
                          disabled={acting === r.id}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors font-medium"
                        >
                          {acting === r.id ? '…' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => { const note = prompt('Rejection reason (optional):') || undefined; act(r.id, 'reject', note) }}
                          disabled={acting === r.id}
                          className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors font-medium"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {r.status === 'approved' && <span className="text-xs text-green-600 font-medium">Account created ✓</span>}
                    {r.status === 'rejected' && <span className="text-xs text-red-500">Rejected</span>}
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
