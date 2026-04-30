import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan_id } = await req.json()
    const plan = PLANS[plan_id as keyof typeof PLANS]
    if (!plan || plan.price === 0) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const { data: firm } = await supabase.from('firms').select('id').eq('user_id', user.id).single()
    if (!firm) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })

    // Only create order if Razorpay key is real
    const keyId = process.env.RAZORPAY_KEY_ID || ''
    if (!keyId.startsWith('rzp_') || keyId.includes('placeholder')) {
      // Return mock order for dev
      return NextResponse.json({
        order_id: `mock_order_${Date.now()}`,
        amount: plan.price * 100,
        currency: 'INR',
        plan_id,
        key_id: 'rzp_test_mock',
        firm_id: firm.id,
        is_mock: true,
      })
    }

    const Razorpay = (await import('razorpay')).default
    const rzp = new Razorpay({ key_id: keyId, key_secret: process.env.RAZORPAY_KEY_SECRET! })
    const order = await rzp.orders.create({
      amount: plan.price * 100,
      currency: 'INR',
      receipt: `runagent_${firm.id}_${Date.now()}`,
      notes: { plan_id, firm_id: firm.id },
    })

    return NextResponse.json({ order_id: order.id, amount: plan.price * 100, currency: 'INR', plan_id, key_id: keyId, firm_id: firm.id })
  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
