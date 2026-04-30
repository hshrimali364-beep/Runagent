'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RequestAccessPage() {
  const [form, setForm] = useState({ full_name:'', firm_name:'', email:'', mobile:'', city:'', monthly_volume:'' })
  const [state, setState] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('loading')
    try {
      const res = await fetch('/api/access-request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'Failed'); setState('error'); return }
      setState('success')
    } catch { setMsg('Network error. Please try again.'); setState('error') }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="font-bold text-xl">Run<span className="text-blue-600">Agent</span></Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Request Access</h1>
          <p className="text-gray-500">Approved firms get 50 free bill credits. Reviewed within 24 hours.</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {state === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
              <p className="text-gray-500 mb-6">Your request is under review. We&apos;ll notify you at <strong>{form.email}</strong> within 24 hours.</p>
              <Link href="/" className="text-blue-600 font-medium hover:underline">← Back to home</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="CA Ravi Kumar" required value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CA Firm Name *</label>
                <input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Kumar & Associates" required value={form.firm_name} onChange={e => setForm(f=>({...f,firm_name:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="ravi@firm.com" required value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input type="tel" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="+91 98765 43210" required value={form.mobile} onChange={e => setForm(f=>({...f,mobile:e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Ahmedabad" required value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Bills *</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" required value={form.monthly_volume} onChange={e => setForm(f=>({...f,monthly_volume:e.target.value}))}>
                    <option value="">Select</option>
                    {['Under 100','100–300','300–800','800–1500','1500+'].map(v=><option key={v} value={v}>{v} bills</option>)}
                  </select>
                </div>
              </div>
              {state === 'error' && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{msg}</p>}
              <button type="submit" disabled={state==='loading'} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {state === 'loading' ? 'Submitting…' : 'Submit Request'}
              </button>
              <p className="text-xs text-gray-400 text-center">By submitting, you agree to our Terms & Privacy Policy.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
