import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function checkAdmin(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const [firms, requests, invoices, payments] = await Promise.all([
    admin.from('firms').select('id, plan_id, is_active', { count: 'exact' }),
    admin.from('access_requests').select('id, status', { count: 'exact' }),
    admin.from('invoices').select('id', { count: 'exact', head: true }),
    admin.from('payments').select('amount, status'),
  ])

  const activeFirms = firms.data?.filter(f => f.is_active).length || 0
  const pendingReqs = requests.data?.filter(r => r.status === 'pending').length || 0
  const revenue = payments.data?.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0) || 0

  const planCounts: Record<string, number> = {}
  firms.data?.forEach(f => { planCounts[f.plan_id] = (planCounts[f.plan_id] || 0) + 1 })

  return NextResponse.json({
    total_firms: firms.count || 0,
    active_firms: activeFirms,
    pending_requests: pendingReqs,
    total_bills: invoices.count || 0,
    monthly_revenue: revenue,
    plan_distribution: planCounts,
  })
}
