'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [secret, setSecret] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    })
    const data = await res.json()
    if (data.success) {
      router.push('/admin')
      router.refresh()
    } else {
      setErr('Invalid admin password.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="font-bold text-2xl mb-1">Run<span className="text-blue-600">Agent</span></div>
          <p className="text-gray-500 text-sm">Admin Panel Access</p>
        </div>
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter admin secret"
              required
              value={secret}
              onChange={e => setSecret(e.target.value)}
            />
          </div>
          {err && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying…' : 'Access Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
