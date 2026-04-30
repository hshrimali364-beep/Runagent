import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { full_name, firm_name, email, mobile, city, monthly_volume } = await req.json()
    if (!full_name || !firm_name || !email || !mobile || !city || !monthly_volume)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: existing } = await admin.from('access_requests').select('id,status').eq('email', email.toLowerCase()).maybeSingle()

    if (existing) {
      const msgs: Record<string, string> = {
        approved: 'This email is already approved. Please login.',
        pending: 'Your request is already under review.',
        rejected: 'Your previous request was rejected. Contact hello@runagent.in',
      }
      return NextResponse.json({ error: msgs[existing.status] || 'Already submitted' }, { status: 409 })
    }

    const { data, error } = await admin.from('access_requests').insert({
      full_name: full_name.trim(), firm_name: firm_name.trim(),
      email: email.toLowerCase().trim(), mobile: mobile.trim(),
      city: city.trim(), monthly_volume, status: 'pending',
    }).select().single()

    if (error) return NextResponse.json({ error: 'Failed to submit. Try again.' }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
