'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [state, setState] = useState<'idle'|'loading'|'done'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('loading')
    // In production send via Resend
    await new Promise(r => setTimeout(r, 1000))
    setState('done')
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="font-bold text-xl">Run<span className="text-blue-600">Agent</span></Link>
        <div className="flex gap-6 text-sm text-gray-600">
          <Link href="/features" className="hover:text-black">Features</Link>
          <Link href="/pricing" className="hover:text-black">Pricing</Link>
          <Link href="/request-access" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Request Access</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              Have questions about RunAgent? Want a demo for your CA firm? Our team is happy to help.
            </p>
            <div className="space-y-5">
              {[
                { icon: '✉', label: 'Email', value: 'hello@runagent.in' },
                { icon: '💬', label: 'WhatsApp', value: '+91 98765 43210' },
                { icon: '📍', label: 'Location', value: 'Ahmedabad, Gujarat, India' },
                { icon: '🕐', label: 'Support Hours', value: 'Mon–Sat, 9am–7pm IST' },
              ].map(c => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{c.icon}</div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{c.label}</div>
                    <div className="font-medium text-gray-900">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-5 bg-blue-50 rounded-2xl">
              <p className="text-sm font-semibold text-blue-900 mb-1">Want to try RunAgent?</p>
              <p className="text-sm text-blue-700 mb-3">Request access and get 50 free bill credits to start.</p>
              <Link href="/request-access" className="text-sm font-bold text-blue-600 hover:underline">Request Access →</Link>
            </div>
          </div>

          {/* Right form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            {state === 'done' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-500 text-sm">We&apos;ll get back to you within a few hours on business days.</p>
                <button onClick={() => { setState('idle'); setForm({ name:'', email:'', subject:'', message:'' }) }} className="mt-6 text-blue-600 font-medium text-sm hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-gray-900 text-lg mb-5">Send a Message</h2>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                      <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="CA Ravi Kumar" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input type="email" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="you@firm.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                    <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Pricing query, Demo request" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                    <textarea rows={5} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Tell us how we can help…" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={state === 'loading'} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {state === 'loading' ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
