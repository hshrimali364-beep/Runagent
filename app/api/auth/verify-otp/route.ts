import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()
    if (!email || !otp) return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 })

    const admin = createAdminClient()

    // Get OTP record
    const { data: otpRecord } = await admin.from('otp_codes')
      .select('*').eq('email', email.toLowerCase()).maybeSingle()

    if (!otpRecord) return NextResponse.json({ error: 'No OTP found. Request a new one.' }, { status: 404 })
    if (new Date(otpRecord.expires_at) < new Date()) return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 410 })
    if (otpRecord.otp !== otp.trim()) return NextResponse.json({ error: 'Invalid OTP. Try again.' }, { status: 401 })

    // Get firm user
    const { data: firm } = await admin.from('firms').select('*').eq('email', email.toLowerCase()).single()
    if (!firm) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    // Create a real session by signing in with admin privileges
    const { data: sessionData, error: sessionErr } = await admin.auth.admin.getUserById(firm.user_id)
    if (sessionErr || !sessionData.user) return NextResponse.json({ error: 'Could not create session' }, { status: 500 })

    // Generate a short-lived magic link and return it so client can exchange for session
    const { data: authData, error: authErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
    })
    if (authErr) throw authErr

    // Delete used OTP
    await admin.from('otp_codes').delete().eq('email', email.toLowerCase())

    return NextResponse.json({
      success: true,
      action_link: authData.properties?.action_link,
      firm: { id: firm.id, firm_name: firm.firm_name },
    })
  } catch (err: unknown) {
    console.error('Verify OTP error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
