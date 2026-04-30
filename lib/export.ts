import * as XLSX from 'xlsx'
import type { Invoice, LineItem } from '@/lib/types'

// Excel export — Image 2 jaisi format: har item alag row
export function exportToExcel(invoices: Invoice[]): Buffer {
  const rows: Record<string, unknown>[] = []

  for (const inv of invoices) {
    const items: LineItem[] = (inv.line_items && inv.line_items.length > 0)
      ? inv.line_items
      : [{
          description:    inv.description || inv.vendor_name || '',
          hsn_code:       inv.hsn_code || '',
          taxable_amount: inv.taxable_amount,
          cgst:           inv.cgst,
          sgst:           inv.sgst,
          igst:           inv.igst,
          total_amount:   inv.total_amount,
        }]

    for (const item of items) {
      rows.push({
        'Date':            inv.invoice_date  || '',
        'Invoice No.':     inv.invoice_number || '',
        'Vendor Name':     inv.vendor_name   || '',
        'GSTIN':           inv.gstin         || '',
        'HSN Code':        item.hsn_code     || inv.hsn_code || '',
        'Particulars':     item.description  || '',
        'Quantity':        item.quantity     ?? '',
        'Unit':            item.unit         || '',
        'Rate':            item.rate         ?? '',
        'Taxable Value':   item.taxable_amount,
        'CGST (9%)':       item.cgst,
        'SGST (9%)':       item.sgst,
        'IGST':            item.igst,
        'Total Amount':    item.total_amount,
        'Status':          inv.status,
        'Client':          (inv.client as { name?: string } | undefined)?.name || '',
      })
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows)

  // Bold header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'DBEAFE' } } }
  }

  ws['!cols'] = [
    {wch:12},{wch:16},{wch:28},{wch:18},{wch:12},
    {wch:28},{wch:10},{wch:8},{wch:10},{wch:14},
    {wch:11},{wch:11},{wch:10},{wch:14},{wch:10},{wch:20},
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice Items')

  // Summary sheet
  const total   = invoices.reduce((s, i) => s + i.total_amount, 0)
  const cgstSum = invoices.reduce((s, i) => s + i.cgst, 0)
  const sgstSum = invoices.reduce((s, i) => s + i.sgst, 0)
  const igstSum = invoices.reduce((s, i) => s + i.igst, 0)
  const taxable = invoices.reduce((s, i) => s + i.taxable_amount, 0)

  const ws2 = XLSX.utils.aoa_to_sheet([
    ['RunAgent Export Summary'],
    ['Generated At',   new Date().toLocaleString('en-IN')],
    ['Total Invoices', invoices.length],
    ['Total Items',    rows.length],
    [''],
    ['Taxable Total',  taxable],
    ['Total CGST',     cgstSum],
    ['Total SGST',     sgstSum],
    ['Total IGST',     igstSum],
    ['Grand Total',    total],
  ])
  ws2['!cols'] = [{wch:20},{wch:20}]
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export function exportToCSV(invoices: Invoice[]): string {
  const headers = [
    'Date','Invoice No.','Vendor Name','GSTIN','HSN Code','Particulars',
    'Quantity','Unit','Rate','Taxable Value','CGST','SGST','IGST','Total Amount','Status','Client',
  ]
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g,'""')}"` : s
  }

  const rows: string[] = []
  for (const inv of invoices) {
    const items: LineItem[] = (inv.line_items && inv.line_items.length > 0)
      ? inv.line_items
      : [{
          description:    inv.description || '',
          hsn_code:       inv.hsn_code || '',
          taxable_amount: inv.taxable_amount,
          cgst:           inv.cgst,
          sgst:           inv.sgst,
          igst:           inv.igst,
          total_amount:   inv.total_amount,
        }]

    for (const item of items) {
      rows.push([
        inv.invoice_date, inv.invoice_number, inv.vendor_name, inv.gstin,
        item.hsn_code || inv.hsn_code, item.description,
        item.quantity, item.unit, item.rate,
        item.taxable_amount, item.cgst, item.sgst, item.igst, item.total_amount,
        inv.status, (inv.client as { name?: string } | undefined)?.name,
      ].map(esc).join(','))
    }
  }
  return [headers.join(','), ...rows].join('\n')
}

export function exportToTally(invoices: Invoice[], firmName: string): string {
  const approved = invoices.filter(i => i.status === 'approved')

  const vouchers = approved.map(inv => {
    const items: LineItem[] = (inv.line_items && inv.line_items.length > 0)
      ? inv.line_items
      : [{
          description:    inv.description || inv.vendor_name || 'Purchase',
          hsn_code:       inv.hsn_code || '',
          taxable_amount: inv.taxable_amount,
          cgst:           inv.cgst,
          sgst:           inv.sgst,
          igst:           inv.igst,
          total_amount:   inv.total_amount,
        }]

    const inventoryEntries = items.map(item => `
        <ALLINVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${escXml(item.description)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <RATE>${item.rate || ''}</RATE>
          <AMOUNT>${item.taxable_amount.toFixed(2)}</AMOUNT>
          <ACTUALQTY>${item.quantity || 1} ${item.unit || 'Nos'}</ACTUALQTY>
          <BILLEDQTY>${item.quantity || 1} ${item.unit || 'Nos'}</BILLEDQTY>
          <BATCHALLOCATIONS.LIST>
            <GODOWNNAME>Main Location</GODOWNNAME>
            <BATCHNAME>Primary Batch</BATCHNAME>
            <AMOUNT>${item.taxable_amount.toFixed(2)}</AMOUNT>
            <ACTUALQTY>${item.quantity || 1}</ACTUALQTY>
            <BILLEDQTY>${item.quantity || 1}</BILLEDQTY>
          </BATCHALLOCATIONS.LIST>
        </ALLINVENTORYENTRIES.LIST>`).join('')

    const totalCGST = items.reduce((s, i) => s + i.cgst, 0)
    const totalSGST = items.reduce((s, i) => s + i.sgst, 0)
    const totalIGST = items.reduce((s, i) => s + i.igst, 0)
    const totalTaxable = items.reduce((s, i) => s + i.taxable_amount, 0)

    return `
    <VOUCHER VCHTYPE="Purchase" ACTION="Create">
      <DATE>${tallyDate(inv.invoice_date)}</DATE>
      <VOUCHERNUMBER>${escXml(inv.invoice_number || '')}</VOUCHERNUMBER>
      <REFERENCE>${escXml(inv.invoice_number || '')}</REFERENCE>
      <NARRATION>Purchase from ${escXml(inv.vendor_name || '')} | GSTIN: ${inv.gstin || ''}</NARRATION>
      <PARTYLEDGERNAME>${escXml(inv.vendor_name || 'Sundry Creditor')}</PARTYLEDGERNAME>
      ${inventoryEntries}
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Purchase Account</LEDGERNAME>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <AMOUNT>${totalTaxable.toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      ${totalCGST > 0 ? `<ALLLEDGERENTRIES.LIST><LEDGERNAME>CGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${totalCGST.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>` : ''}
      ${totalSGST > 0 ? `<ALLLEDGERENTRIES.LIST><LEDGERNAME>SGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${totalSGST.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>` : ''}
      ${totalIGST > 0 ? `<ALLLEDGERENTRIES.LIST><LEDGERNAME>IGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${totalIGST.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>` : ''}
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${escXml(inv.vendor_name || 'Sundry Creditor')}</LEDGERNAME>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <AMOUNT>-${inv.total_amount.toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
    </VOUCHER>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${escXml(firmName)}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">${vouchers}</TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

function escXml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function tallyDate(d?: string) {
  try {
    // Handle DD/MM/YYYY or DD-MM-YYYY format
    if (d && /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(d)) {
      const parts = d.split(/[\/\-\.]/)
      if (parts[2].length === 4) return `${parts[2]}${parts[1].padStart(2,'0')}${parts[0].padStart(2,'0')}`
    }
    const dt = new Date(d!)
    return `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}`
  } catch {
    return new Date().toISOString().split('T')[0].replace(/-/g,'')
  }
}
