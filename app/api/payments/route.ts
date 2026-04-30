import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: firm } = await supabase.from('firms').select('id').eq('user_id', user.id).single()
  if (!firm) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })

  const { data: payments } = await supabase.from('payments')
    .select('*').eq('firm_id', firm.id)
    .order('created_at', { ascending: false }).limit(20)

  return NextResponse.json({ payments: payments || [] })
}
