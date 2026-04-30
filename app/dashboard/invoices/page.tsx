'use client'
import { useState, useEffect, useCallback } from 'react'

interface Invoice {
  id: string
  invoice_number?: string
  invoice_date?: string
  vendor_name?: string
  gstin?: string
  hsn_code?: string
  taxable_amount: number
  cgst: number
  sgst: number
  igst: number
  total_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'review'
  ocr_confidence?: number
  created_at: string
  client?: { name: string }
}

const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  review:   'bg-blue-100 text-blue-700',
}

function fmt(n: number) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/invoices?${params}`)
    const data = await res.json()
    setInvoices(data.invoices || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    showToast(`Invoice ${status}`)
    load()
  }

  const deleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' })
    showToast('Invoice deleted')
    load()
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    await fetch('/api/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    })
    setSaving(false)
    setEditing(null)
    showToast('Invoice updated')
    load()
  }

  return (
    <div className="max-w-6xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total invoices</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <input
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
          placeholder="Search vendor, invoice #, GSTIN"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="review">Needs Review</option>
        </select>
        <button onClick={load} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
           Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading invoices</div>
        ) : !invoices.length ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3"></div>
            <p className="font-medium text-gray-600">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Upload bills to see extracted invoices'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice #</th>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">GSTIN</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoice_number || ''}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-32 truncate">{inv.vendor_name || ''}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.client?.name || ''}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.gstin || ''}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(inv.taxable_amount)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {inv.cgst > 0 && <div>C: {fmt(inv.cgst)}</div>}
                      {inv.sgst > 0 && <div>S: {fmt(inv.sgst)}</div>}
                      {inv.igst > 0 && <div>I: {fmt(inv.igst)}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(inv.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                        {inv.status}
                        {inv.ocr_confidence && <span className="ml-1 opacity-60">{inv.ocr_confidence}%</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {inv.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(inv.id, 'approved')}
                            className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200 transition-colors font-medium"
                          >Approve</button>
                        )}
                        {inv.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(inv.id, 'rejected')}
                            className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >Reject</button>
                        )}
                        <button
                          onClick={() => setEditing({ ...inv } as unknown as Invoice)}
                          className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                        >Edit</button>
                        <button
                          onClick={() => deleteInvoice(inv.id)}
                          className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-gray-900 text-lg">Edit Invoice</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none"></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['invoice_number', 'Invoice #', 'text'],
                ['invoice_date', 'Date', 'text'],
                ['vendor_name', 'Vendor Name', 'text'],
                ['gstin', 'GSTIN', 'text'],
                ['hsn_code', 'HSN Code', 'text'],
                ['taxable_amount', 'Taxable Amount', 'number'],
                ['cgst', 'CGST', 'number'],
                ['sgst', 'SGST', 'number'],
                ['igst', 'IGST', 'number'],
                ['total_amount', 'Total Amount', 'number'],
              ].map(([key, label, type]) => (
                <div key={key} className={key === 'vendor_name' || key === 'gstin' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    value={((editing as unknown) as Record<string, string | number>)[key] ?? ''}
                    onChange={e => setEditing(prev => prev ? { ...prev, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value } : null)}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  value={editing.status}
                  onChange={e => setEditing(prev => prev ? { ...prev, status: e.target.value as Invoice['status'] } : null)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="review">Needs Review</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
