import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'
import { PLANS } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, is_mock } = await req.json()

    const plan = PLANS[plan_id as keyof typeof PLANS]
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const admin = createAdminClient()

    // Get firm_id from authenticated user — never trust client-sent firm_id
    const { data: firmRow } = await admin.from('firms').select('id').eq('user_id', user.id).single()
    if (!firmRow) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
    const firm_id = firmRow.id

    // Verify signature (skip for mock)
    if (!is_mock) {
      const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
      if (expected !== razorpay_signature) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Save payment
    await admin.from('payments').insert({
      firm_id, plan_id,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      amount: plan.price,
      currency: 'INR',
      status: 'paid',
    })

    // Upgrade firm
    await admin.from('firms').update({
      plan_id,
      total_credits: plan.credits,
      used_credits: 0,
    }).eq('id', firm_id)

    // Log
    await admin.from('subscriptions').insert({
      firm_id, plan_id,
      razorpay_order_id, razorpay_payment_id,
      amount: plan.price,
      status: 'active',
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({ success: true, plan_name: plan.name, credits: plan.credits })
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
