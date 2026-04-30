'use client'
import { useEffect, useState, useCallback } from 'react'

interface Client { id:string; name:string; mobile?:string; notes?:string; bill_limit?:number; created_at:string; upload_tokens?: {token:string; is_active:boolean}[] }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', mobile:'', notes:'', bill_limit:'' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [newToken, setNewToken] = useState('')

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const load = useCallback(async () => {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data.clients || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''), 3500) }

  const addClient = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const data = await res.json()
    if (data.success) {
      setNewToken(data.token)
      setShowForm(false)
      setForm({ name:'', mobile:'', notes:'', bill_limit:'' })
      load()
      showToast(`Client added successfully`)
    }
    setSaving(false)
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${appUrl}/upload/${token}`)
    showToast('Link copied to clipboard')
  }

  const shareWhatsApp = (client: Client, token: string) => {
    const link = `${appUrl}/upload/${token}`
    const msg = encodeURIComponent(`Hello ${client.name},\n\nPlease upload your bills using this secure RunAgent link:\n${link}\n\nNo login needed — just tap and upload your bill photos.`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const getToken = (c: Client) => c.upload_tokens?.find(t=>t.is_active)?.token

  return (
    <div className="max-w-4xl mx-auto">
      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-up">{toast}</div>}

      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Clients</h1><p className="text-gray-500 text-sm mt-1">{clients.length} clients total</p></div>
        <button onClick={()=>setShowForm(true)} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">+ Add Client</button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">New Client</h2>
          <form onSubmit={addClient} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" required placeholder="Sharma Traders" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="+91 98765 43210" value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Upload Limit</label>
              <input type="number" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Leave blank for unlimited" value={form.bill_limit} onChange={e=>setForm(f=>({...f,bill_limit:e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Monthly vendor bills" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Adding…' : 'Add Client & Generate Link'}</button>
              <button type="button" onClick={()=>setShowForm(false)} className="text-gray-500 text-sm px-4 py-2.5 hover:text-gray-700 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* New token display */}
      {newToken && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-green-800 mb-2">Upload link generated</p>
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5 border border-green-200">
            <code className="flex-1 text-sm text-blue-600 truncate">{appUrl}/upload/{newToken}</code>
            <button onClick={()=>copyLink(newToken)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">Copy</button>
          </div>
          <button onClick={()=>setNewToken('')} className="text-xs text-green-700 mt-3 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading clients…</div>
      ) : !clients.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          
          <h3 className="font-semibold text-gray-900 mb-1">No clients yet</h3>
          <p className="text-gray-500 text-sm mb-4">Add your first client to generate a WhatsApp upload link.</p>
          <button onClick={()=>setShowForm(true)} className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">+ Add First Client</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">Mobile</th>
                <th className="px-5 py-3 text-left">Upload Link</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(c => {
                const token = getToken(c)
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      {c.notes && <div className="text-xs text-gray-400 mt-0.5">{c.notes}</div>}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{c.mobile || '—'}</td>
                    <td className="px-5 py-4">
                      {token ? (
                        <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">/upload/{token.slice(0,12)}…</code>
                      ) : <span className="text-gray-400 text-xs">No link</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {token && <>
                          <button onClick={()=>copyLink(token)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">Copy Link</button>
                          <button onClick={()=>shareWhatsApp(c, token)} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors font-medium">WhatsApp</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
