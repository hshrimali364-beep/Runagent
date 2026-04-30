import { createAdminClient } from '@/lib/supabase/server'

export async function approveFirmRequest(requestId: string) {
  const admin = createAdminClient()
  const { data: req } = await admin.from('access_requests').select('*').eq('id', requestId).single()
  if (!req) throw new Error('Request not found')

  const { data: authUser, error: authErr } = await admin.auth.admin.inviteUserByEmail(req.email, {
    data: { firm_name: req.firm_name, full_name: req.full_name },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
  if (authErr) throw new Error(authErr.message)

  await admin.from('firms').insert({
    user_id: authUser.user.id,
    firm_name: req.firm_name,
    owner_name: req.full_name,
    email: req.email,
    mobile: req.mobile,
    city: req.city,
    plan_id: 'free',
    total_credits: 50,
    used_credits: 0,
    is_active: true,
  })

  await admin.from('access_requests').update({
    status: 'approved',
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId)

  await admin.from('admin_logs').insert({
    action: 'approve_request',
    target_id: requestId,
    target_type: 'access_request',
    meta: { email: req.email },
  })

  return { email: req.email, firm_name: req.firm_name }
}

export async function rejectFirmRequest(requestId: string, note?: string) {
  const admin = createAdminClient()
  const { data: req } = await admin.from('access_requests').select('*').eq('id', requestId).single()
  if (!req) throw new Error('Request not found')

  await admin.from('access_requests').update({
    status: 'rejected',
    admin_note: note || '',
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId)

  return { email: req.email, firm_name: req.firm_name }
}
