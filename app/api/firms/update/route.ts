import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { firm_name, owner_name, mobile, city } = await req.json()
    if (!firm_name) return NextResponse.json({ error: 'Firm name required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('firms').update({
      firm_name: firm_name.trim(),
      owner_name: owner_name?.trim() || '',
      mobile: mobile?.trim() || null,
      city: city?.trim() || null,
    }).eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
