'use client'
import { useState, useEffect } from 'react'

interface Client { id: string; name: string }

export default function ExportPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({ format: 'excel', status: 'approved', client_id: '', from: '', to: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients || []))
  }, [])

  const doExport = async () => {
    setLoading(true); setMsg(''); setErr('')
    const params = new URLSearchParams(Object.fromEntries(Object.entries(form).filter(([, v]) => v)))
    try {
      const res = await fetch(`/api/export?${params}`)
      if (!res.ok) {
        const data = await res.json()
        setErr(data.error || 'Export failed')
        setLoading(false)
        return
      }
      const blob = await res.blob()
      const ext = form.format === 'excel' ? 'xlsx' : form.format === 'csv' ? 'csv' : 'xml'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `runagent-export-${new Date().toISOString().split('T')[0]}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setMsg(' File downloaded successfully!')
    } catch {
      setErr('Download failed. Try again.')
    }
    setLoading(false)
  }

  const formats = [
    { id: 'excel', label: 'Excel (.xlsx)', desc: 'Full formatted spreadsheet with summary sheet', icon: '' },
    { id: 'csv', label: 'CSV', desc: 'Plain comma-separated values for any software', icon: '' },
    { id: 'tally', label: 'Tally XML', desc: 'Import directly into Tally ERP / Prime', icon: '' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-500 text-sm mt-1">Download your invoice data in any format</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
        {/* Format */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Export Format</label>
          <div className="grid grid-cols-3 gap-3">
            {formats.map(f => (
              <button
                key={f.id}
                onClick={() => setForm(prev => ({ ...prev, format: f.id }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${form.format === f.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-semibold text-sm text-gray-900">{f.label}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-snug">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Filters</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Invoice Status</label>
              <select
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="approved">Approved Only</option>
                <option value="all">All Invoices</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Client</label>
              <select
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                value={form.client_id}
                onChange={e => setForm(prev => ({ ...prev, client_id: e.target.value }))}
              >
                <option value="">All Clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                value={form.from}
                onChange={e => setForm(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                value={form.to}
                onChange={e => setForm(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {msg && <div className="bg-green-50 text-green-700 text-sm p-4 rounded-xl border border-green-200">{msg}</div>}
        {err && <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">{err}</div>}

        <button
          onClick={doExport}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin"></span> Preparing export</>
          ) : (
            <><span></span> Download {formats.find(f => f.id === form.format)?.label}</>
          )}
        </button>

        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p><strong className="text-gray-700">Excel:</strong> Includes Invoice data + Summary sheet with totals</p>
          <p><strong className="text-gray-700">CSV:</strong> Compatible with any accounting or spreadsheet software</p>
          <p><strong className="text-gray-700">Tally XML:</strong> Import as Purchase Vouchers into Tally ERP 9 or Prime</p>
        </div>
      </div>
    </div>
  )
}
