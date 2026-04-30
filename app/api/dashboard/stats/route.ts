import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: firm } = await supabase.from('firms').select('*').eq('user_id', user.id).single()
  if (!firm) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })

  const [clients, invoices, pending] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id).eq('is_active', true),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id).eq('status', 'pending'),
  ])

  const { data: recent } = await supabase.from('invoices')
    .select('*, client:clients(name)').eq('firm_id', firm.id)
    .order('created_at', { ascending: false }).limit(5)

  return NextResponse.json({
    firm,
    stats: {
      total_clients: clients.count || 0,
      bills_uploaded: invoices.count || 0,
      pending_review: pending.count || 0,
      used_credits: firm.used_credits,
      total_credits: firm.total_credits,
      plan_id: firm.plan_id,
    },
    recent_invoices: recent || [],
  })
}
