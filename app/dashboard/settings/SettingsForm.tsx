'use client'
import { useState } from 'react'

interface Firm {
  id: string; firm_name: string; owner_name: string; mobile?: string; city?: string; plan_id: string
}

export default function SettingsForm({ firm, email }: { firm: Firm; email: string }) {
  const [form, setForm] = useState({ firm_name: firm.firm_name, owner_name: firm.owner_name, mobile: firm.mobile || '', city: firm.city || '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setMsg(''); setErr('')
    try {
      const res = await fetch('/api/firms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Save failed'); setSaving(false); return }
      setMsg('✅ Settings saved successfully!')
      setTimeout(() => setMsg(''), 3000)
    } catch { setErr('Network error') }
    setSaving(false)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your firm profile</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <h2 className="font-semibold text-gray-900 mb-5">Firm Profile</h2>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
            <input required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" value={form.firm_name} onChange={e => setForm(f => ({ ...f, firm_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
            <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" value={email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="+91 98765 43210" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="Ahmedabad" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
          </div>
          {err && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{err}</div>}
          {msg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl">{msg}</div>}
          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
