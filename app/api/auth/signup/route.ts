import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const admin = createAdminClient()

    const { data: existing } = await admin.from('firms').select('id').eq('email', email.toLowerCase()).single()
    if (existing) return NextResponse.json({ error: 'Account already exists' }, { status: 400 })

    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '' },
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

    await admin.from('firms').insert({
      user_id: authData.user.id,
      firm_name: full_name || email.split('@')[0],
      owner_name: full_name || '',
      email: email.toLowerCase(),
      plan_id: 'free',
      total_credits: 50,
      used_credits: 0,
      is_active: true,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Signup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
