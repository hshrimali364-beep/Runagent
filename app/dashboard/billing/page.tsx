'use client'
import { useState, useEffect } from 'react'
import { PLANS } from '@/lib/utils'

interface Firm {
  id: string; plan_id: string; used_credits: number; total_credits: number;
  firm_name: string; owner_name: string
}
interface Payment {
  id: string; plan_id: string; amount: number; status: string; created_at: string; razorpay_payment_id?: string
}

const PLAN_LIST = Object.values(PLANS)

export default function BillingPage() {
  const [firm, setFirm] = useState<Firm | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
    ]).then(([stats]) => {
      setFirm(stats.firm)
      setLoading(false)
    })
    // Load payment history
    fetch('/api/payments').then(r => r.json()).then(d => {
      if (d.payments) setPayments(d.payments)
    })
  }, [])

  const upgrade = async (planId: string, price: number) => {
    if (price === 0) return
    setUpgrading(planId)
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })
      const order = await res.json()

      if (order.is_mock) {
        // Dev mode: simulate payment
        const verRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: order.order_id,
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_signature: 'mock',
            plan_id: planId,
            firm_id: order.firm_id,
            is_mock: true,
          }),
        })
        const verData = await verRes.json() as { success: boolean; plan_name?: string; credits?: number }
        if (verData.success) {
          showToast(` Upgraded to ${verData.plan_name}! ${verData.credits} credits added.`)
          setTimeout(() => window.location.reload(), 1500)
        }
        setUpgrading('')
        return
      }

      // Real Razorpay
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      script.onload = () => {
        const RazorpayClass = (window as unknown as { Razorpay: new (opts: Record<string,unknown>) => { open: () => void } }).Razorpay
        const rzp = new RazorpayClass({
          key: order.key_id,
          amount: order.amount,
          currency: 'INR',
          name: 'RunAgent',
          description: `${PLANS[planId as keyof typeof PLANS]?.name} Plan`,
          order_id: order.order_id,
          handler: async (response: Record<string, string>) => {
            const verRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: planId,
                firm_id: order.firm_id,
              }),
            })
            const verData = await verRes.json()
            if (verData.success) {
              showToast(` Upgraded to ${verData.plan_name}!`)
              setTimeout(() => window.location.reload(), 1500)
            }
          },
          prefill: { name: firm?.owner_name, email: '' },
          theme: { color: '#1a56db' },
        })
        rzp.open()
        setUpgrading('')
      }
    } catch {
      showToast('Payment initiation failed. Try again.')
      setUpgrading('')
    }
  }

  const pct = firm ? Math.round((firm.used_credits / firm.total_credits) * 100) : 0

  if (loading) return <div className="text-center py-20 text-gray-400">Loading billing</div>

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">{toast}</div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Credits</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your plan and bill credits</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Current Plan</p>
            <h2 className="text-xl font-bold text-gray-900 capitalize">{firm?.plan_id} Plan</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {firm ? `₹${PLANS[firm.plan_id as keyof typeof PLANS]?.price || 0}/month` : ''}
            </p>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">Active</span>
        </div>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-500">Credits used</span>
          <span className={`font-semibold ${pct >= 80 ? 'text-amber-600' : 'text-gray-900'}`}>
            {firm?.used_credits} / {firm?.total_credits}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>{pct}% used</span>
          <span>{(firm?.total_credits || 0) - (firm?.used_credits || 0)} remaining</span>
        </div>
        {pct >= 80 && (
          <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-lg">
             You&apos;ve used {pct}% of your credits. Upgrade to avoid interruption.
          </div>
        )}
      </div>

      {/* Plans */}
      <h2 className="font-bold text-gray-900 mb-4">Upgrade Plan</h2>
      <div className="grid grid-cols-1 gap-4 mb-8">
        {PLAN_LIST.filter(p => p.id !== 'free').map(plan => {
          const isCurrent = firm?.plan_id === plan.id
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-5 flex items-center justify-between transition-all ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{plan.name}</span>
                  {isCurrent && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  <span className="font-semibold text-gray-900">₹{plan.price.toLocaleString('en-IN')}/mo</span>
                  {'  '}{plan.credits.toLocaleString('en-IN')} bills/month
                </div>
                {plan.id === 'growth' && <span className="text-xs text-blue-600 font-medium"> Most Popular</span>}
              </div>
              {!isCurrent && (
                <button
                  onClick={() => upgrade(plan.id, plan.price)}
                  disabled={!!upgrading}
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {upgrading === plan.id ? 'Processing' : 'Upgrade '}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-6">
        <p className="font-medium mb-1">Extra usage pricing</p>
        <p className="text-gray-500 text-xs">Bills beyond your plan limit are charged at <strong className="text-gray-700">₹3 per bill</strong>. Billed automatically via Razorpay.</p>
        <p className="text-gray-400 text-xs mt-2">Payments secured by Razorpay  UPI, Cards, Net Banking accepted</p>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Payment History</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium capitalize">{p.plan_id}</td>
                  <td className="px-5 py-3">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
