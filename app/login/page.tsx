'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ya password galat hai.'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: name }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Signup failed'); setLoading(false); return }
    setSuccess('Account ban gaya! Ab Sign In karo.')
    setMode('signin')
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess('Password reset email bhej diya! Inbox check karo.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gray-900 p-12">
        <Link href="/" className="text-white font-bold text-xl">Run<span className="text-blue-400">Agent</span></Link>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">Your accounting workflow,<br /><span className="text-gray-400 italic">streamlined</span></h2>
          <ul className="space-y-3 text-gray-400 text-sm">
            {['Bill photos to structured data in minutes','GST-ready extraction — CGST, SGST, IGST','One-click Tally and Excel export','WhatsApp-first client experience'].map(t=>(
              <li key={t} className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"/>{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-gray-600 text-xs">© {new Date().getFullYear()} RunAgent · Made in India 🇮🇳</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-bold text-xl">Run<span className="text-blue-600">Agent</span></Link>
          </div>

          {mode === 'signin' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h1>
              <p className="text-gray-500 text-sm mb-8">Apna account kholo</p>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="••••••••" />
                </div>
                {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
                {success && <div className="bg-green-50 border border-green-100 text-green-700 text-sm p-3 rounded-lg">{success}</div>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {loading ? 'Loading…' : 'Sign In →'}
                </button>
              </form>
              <div className="mt-4 flex justify-between text-sm">
                <button onClick={()=>{setMode('forgot');setError('');setSuccess('')}} className="text-blue-600 hover:underline">Forgot Password?</button>
                <button onClick={()=>{setMode('signup');setError('');setSuccess('')}} className="text-blue-600 hover:underline">Sign Up</button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign Up</h1>
              <p className="text-gray-500 text-sm mb-8">Naya account banao</p>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" required value={name} onChange={e=>setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Aapka naam" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Min 6 characters" />
                </div>
                {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
                {success && <div className="bg-green-50 border border-green-100 text-green-700 text-sm p-3 rounded-lg">{success}</div>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {loading ? 'Creating…' : 'Sign Up →'}
                </button>
              </form>
              <div className="mt-4 text-center text-sm">
                <button onClick={()=>{setMode('signin');setError('');setSuccess('')}} className="text-blue-600 hover:underline">← Wapas Sign In</button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password</h1>
              <p className="text-gray-500 text-sm mb-8">Email daalo — reset link bhejenge</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="your@email.com" />
                </div>
                {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
                {success && <div className="bg-green-50 border border-green-100 text-green-700 text-sm p-3 rounded-lg">{success}</div>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {loading ? 'Sending…' : 'Reset Link Bhejo →'}
                </button>
              </form>
              <div className="mt-4 text-center text-sm">
                <button onClick={()=>{setMode('signin');setError('');setSuccess('')}} className="text-blue-600 hover:underline">← Wapas Sign In</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
