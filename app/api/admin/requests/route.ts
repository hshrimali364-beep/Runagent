import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { approveFirmRequest, rejectFirmRequest } from '@/lib/auth'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

function checkAdmin(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') || req.cookies.get('admin_session')?.value
  return secret === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const status = new URL(req.url).searchParams.get('status')
  let q = admin.from('access_requests').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { action, id, note } = await req.json()
    if (action === 'approve') {
      const result = await approveFirmRequest(id)
      await sendApprovalEmail(result.email, result.firm_name, `${process.env.NEXT_PUBLIC_APP_URL}/login`)
      return NextResponse.json({ success: true, message: `Approved and email sent to ${result.email}` })
    }
    if (action === 'reject') {
      const result = await rejectFirmRequest(id, note)
      await sendRejectionEmail(result.email, result.firm_name, note)
      return NextResponse.json({ success: true, message: 'Rejected and notified' })
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Action failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
