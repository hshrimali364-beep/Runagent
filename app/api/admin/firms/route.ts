import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function checkAdmin(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') || req.cookies.get('admin_session')?.value
  return secret === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('firms').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ firms: data })
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { action, firm_id, plan_id, credits } = await req.json()
  const admin = createAdminClient()

  if (action === 'suspend') {
    await admin.from('firms').update({ is_active: false }).eq('id', firm_id)
    return NextResponse.json({ success: true })
  }
  if (action === 'activate') {
    await admin.from('firms').update({ is_active: true }).eq('id', firm_id)
    return NextResponse.json({ success: true })
  }
  if (action === 'upgrade') {
    await admin.from('firms').update({ plan_id, total_credits: credits, used_credits: 0 }).eq('id', firm_id)
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
