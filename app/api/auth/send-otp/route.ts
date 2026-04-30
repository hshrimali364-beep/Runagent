import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOtpEmail } from '@/lib/email'

// In-memory OTP store (use Redis in production)
// For Vercel: store in Supabase table otp_codes
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const admin = createAdminClient()

    // Check if email is approved
    const { data: firm } = await admin.from('firms').select('id,firm_name,is_active').eq('email', email.toLowerCase()).maybeSingle()

    if (!firm) {
      // Check if pending request
      const { data: req2 } = await admin.from('access_requests').select('status').eq('email', email.toLowerCase()).maybeSingle()
      if (req2?.status === 'pending') return NextResponse.json({ error: 'PENDING' }, { status: 403 })
      if (req2?.status === 'rejected') return NextResponse.json({ error: 'REJECTED' }, { status: 403 })
      return NextResponse.json({ error: 'NO_ACCOUNT' }, { status: 404 })
    }

    if (!firm.is_active) return NextResponse.json({ error: 'SUSPENDED' }, { status: 403 })

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Store OTP in Supabase
    await admin.from('otp_codes').upsert({
      email: email.toLowerCase(),
      otp,
      expires_at: expiresAt,
    }, { onConflict: 'email' })

    // Send email
    await sendOtpEmail(email, otp, firm.firm_name)

    return NextResponse.json({ success: true, message: 'OTP sent to your email' })
  } catch (err: unknown) {
    console.error('Send OTP error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
