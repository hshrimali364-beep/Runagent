import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportToExcel, exportToCSV, exportToTally } from '@/lib/export'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: firm } = await supabase.from('firms').select('*').eq('user_id', user.id).single()
    if (!firm) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })

    const p = new URL(req.url).searchParams
    const format = p.get('format') || 'excel'
    const status = p.get('status') || 'approved'
    const clientId = p.get('client_id')
    const from = p.get('from'), to = p.get('to')

    let q = supabase.from('invoices').select('*, client:clients(id,name)').eq('firm_id', firm.id)
    if (status !== 'all') q = q.eq('status', status)
    if (clientId) q = q.eq('client_id', clientId)
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to + 'T23:59:59')
    q = q.order('created_at', { ascending: false })

    const { data: invoices, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!invoices?.length) return NextResponse.json({ error: 'No invoices found for selected filters' }, { status: 404 })

    // Parse line_items JSON string
    const parsedInvoices = (invoices || []).map((inv: Record<string, unknown>) => ({
      ...inv,
      line_items: inv.line_items
        ? (() => { try { return typeof inv.line_items === 'string' ? JSON.parse(inv.line_items) : inv.line_items } catch { return [] } })()
        : [],
    }))

    const date = new Date().toISOString().split('T')[0]

    if (format === 'excel') {
      const buf = exportToExcel(parsedInvoices as never)
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="runagent-${date}.xlsx"`,
        },
      })
    }

    if (format === 'csv') {
      const csv = exportToCSV(parsedInvoices as never)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="runagent-${date}.csv"`,
        },
      })
    }

    if (format === 'tally') {
      const xml = exportToTally(parsedInvoices as never, firm.firm_name)
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="runagent-tally-${date}.xml"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
