import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getFirmId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: firm } = await supabase.from('firms').select('id').eq('user_id', user.id).single()
  return firm?.id ?? null
}

// GET /api/clients
export async function GET() {
  const supabase = await createClient()
  const firmId = await getFirmId(supabase)
  if (!firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('clients')
    .select('*, upload_tokens(token, expires_at, is_active)')
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: data })
}

// POST /api/clients
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const firmId = await getFirmId(supabase)
    if (!firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, mobile, notes, bill_limit } = await req.json()
    if (!name) return NextResponse.json({ error: 'Client name required' }, { status: 400 })

    const admin = createAdminClient()

    // Create client
    const { data: client, error: clientErr } = await admin.from('clients').insert({
      firm_id: firmId, name: name.trim(),
      mobile: mobile?.trim() || null,
      notes: notes?.trim() || null,
      bill_limit: bill_limit ? parseInt(bill_limit) : null,
    }).select().single()
    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })

    // Generate upload token
    const { data: tokenRow } = await admin.from('upload_tokens').insert({
      client_id: client.id,
      firm_id: firmId,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }).select('token').single()

    return NextResponse.json({ success: true, client, token: tokenRow?.token })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/clients?id=
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const firmId = await getFirmId(supabase)
  if (!firmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await supabase.from('clients').update({ is_active: false }).eq('id', id).eq('firm_id', firmId)
  return NextResponse.json({ success: true })
}
