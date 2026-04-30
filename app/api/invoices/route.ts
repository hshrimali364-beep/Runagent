import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getFirmId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: firm } = await supabase.from('firms').select('id').eq('user_id', user.id).single()
  return firm?.id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const firmId = await getFirmId(supabase)
  if (!firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const p = new URL(req.url).searchParams
  const status = p.get('status'), clientId = p.get('client_id')
  const from = p.get('from'), to = p.get('to'), search = p.get('search')
  const page = parseInt(p.get('page') || '1'), limit = parseInt(p.get('limit') || '50')

  let q = supabase.from('invoices').select('*, client:clients(id,name)', { count: 'exact' })
    .eq('firm_id', firmId).order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status && status !== 'all') q = q.eq('status', status)
  if (clientId) q = q.eq('client_id', clientId)
  if (from) q = q.gte('created_at', from)
  if (to) q = q.lte('created_at', to + 'T23:59:59')
  if (search) q = q.or(`vendor_name.ilike.%${search}%,invoice_number.ilike.%${search}%,gstin.ilike.%${search}%`)

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data, total: count, page, limit })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const firmId = await getFirmId(supabase)
  if (!firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const allowed = ['invoice_number','invoice_date','vendor_name','gstin','hsn_code','description','taxable_amount','cgst','sgst','igst','total_amount','status']
  const clean: Record<string, unknown> = {}
  for (const k of allowed) if (k in updates) clean[k] = updates[k]

  const { data, error } = await supabase.from('invoices').update(clean).eq('id', id).eq('firm_id', firmId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, invoice: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const firmId = await getFirmId(supabase)
  if (!firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { error } = await supabase.from('invoices').delete().eq('id', id).eq('firm_id', firmId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
