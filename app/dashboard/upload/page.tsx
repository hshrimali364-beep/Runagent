'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

interface Client { id: string; name: string }
interface LineItem { description: string; hsn_code?: string; quantity?: number; unit?: string; rate?: number; gst_percent?: number; taxable_amount: number; cgst: number; sgst: number; igst: number; total_amount: number }
interface OcrData {
  invoice_number?: string; invoice_date?: string; vendor_name?: string; gstin?: string
  taxable_amount?: number; cgst?: number; sgst?: number; igst?: number; total_amount?: number
  confidence?: number; confidence_level?: 'high'|'medium'|'low'; line_items?: LineItem[]
  parsed_json?: Record<string, unknown>
}

export default function UploadPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [file, setFile]         = useState<File | null>(null)
  const [state, setState]       = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const [result, setResult]     = useState<{ocr_data: OcrData; credits_remaining: number; invoice_id: string} | null>(null)
  const [err, setErr]           = useState('')
  const [progress, setProgress] = useState(0)
  const [step, setStep]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetch('/api/clients').then(r=>r.json()).then(d=>setClients(d.clients||[])) }, [])

  const upload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !clientId) return
    setState('uploading'); setProgress(5); setErr('')
    const fd = new FormData()
    fd.append('file', file); fd.append('client_id', clientId); fd.append('firm_id', '')
    const steps = [
      { pct: 20, msg: 'Compressing image...' },
      { pct: 40, msg: 'Uploading to storage...' },
      { pct: 60, msg: 'Running OCR extraction...' },
      { pct: 80, msg: 'Parsing with AI...' },
      { pct: 92, msg: 'Saving to database...' },
    ]
    let si = 0
    const interval = setInterval(() => { if (si < steps.length) { setProgress(steps[si].pct); setStep(steps[si].msg); si++ } }, 1400)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      clearInterval(interval); setProgress(100); setStep('Complete')
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Upload failed'); setState('error'); return }
      setResult(data); setState('done')
    } catch { clearInterval(interval); setErr('Network error. Please try again.'); setState('error') }
  }

  const reset = () => { setState('idle'); setFile(null); setResult(null); setErr(''); setProgress(0); setStep(''); if (fileRef.current) fileRef.current.value = '' }

  const downloadJSON = () => {
    if (!result?.ocr_data?.parsed_json) return
    const blob = new Blob([JSON.stringify(result.ocr_data.parsed_json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `invoice-${result.invoice_id}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const confBadge = (level?: string) => {
    if (level === 'high')   return 'bg-green-50 text-green-700 border border-green-100'
    if (level === 'medium') return 'bg-amber-50 text-amber-700 border border-amber-100'
    return 'bg-red-50 text-red-700 border border-red-100'
  }
  const confText = (level?: string) => level === 'high' ? 'High confidence' : level === 'medium' ? 'Medium confidence' : 'Low confidence'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Upload Bills</h1>
        <p className="text-sm text-gray-500 mt-0.5">OCR extraction + AI parsing. Each bill uses 1 credit.</p>
      </div>

      {state === 'done' && result ? (
        <div className="space-y-4">
          {/* Success bar */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bill processed successfully</p>
                <p className="text-xs text-gray-400">{result.credits_remaining} credits remaining</p>
              </div>
            </div>
            {result.ocr_data?.confidence_level && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${confBadge(result.ocr_data.confidence_level)}`}>
                {confText(result.ocr_data.confidence_level)}
              </span>
            )}
          </div>

          {/* Invoice details */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Invoice Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ['Vendor',      result.ocr_data.vendor_name],
                ['GSTIN',       result.ocr_data.gstin],
                ['Invoice No.', result.ocr_data.invoice_number],
                ['Date',        result.ocr_data.invoice_date],
                ['Taxable',     result.ocr_data.taxable_amount ? `₹${result.ocr_data.taxable_amount.toLocaleString('en-IN')}` : null],
                ['CGST',        result.ocr_data.cgst ? `₹${result.ocr_data.cgst}` : null],
                ['SGST',        result.ocr_data.sgst ? `₹${result.ocr_data.sgst}` : null],
                ['IGST',        result.ocr_data.igst ? `₹${result.ocr_data.igst}` : null],
                ['Grand Total', result.ocr_data.total_amount ? `₹${result.ocr_data.total_amount?.toLocaleString('en-IN')}` : null],
              ].filter(([,v])=>v).map(([k,v])=>(
                <div key={k as string} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Items table */}
          {result.ocr_data?.line_items && result.ocr_data.line_items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Line Items <span className="text-gray-400 font-normal text-xs ml-1">({result.ocr_data.line_items.length} items)</span></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Item Description','HSN','Qty','Rate','GST%','Amount'].map(h=>(
                        <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 ${h==='Amount'||h==='Rate'||h==='Qty'||h==='GST%' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {result.ocr_data.line_items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{item.hsn_code || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity ? `${item.quantity} ${item.unit||''}`.trim() : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.rate ? `₹${item.rate}` : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.gst_percent ? `${item.gst_percent}%` : '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{item.total_amount?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-100">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700">Grand Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">₹{result.ocr_data.total_amount?.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Low confidence warning */}
          {result.ocr_data?.confidence_level === 'low' && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800">Extraction quality is low</p>
              <p className="text-xs text-red-600 mt-1">Some data may be missing or incorrect. Please upload a clearer, well-lit image of the bill for better results.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/dashboard/invoices" className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">Review Invoice</Link>
            <button onClick={downloadJSON} className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Download JSON</button>
            <button onClick={reset} className="text-gray-500 text-sm px-4 py-2.5 hover:text-gray-700 transition-colors">Upload Another</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <form onSubmit={upload} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Client <span className="text-red-500">*</span></label>
              <select required value={clientId} onChange={e=>setClientId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white text-gray-900">
                <option value="">Select a client</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Image <span className="text-red-500">*</span></label>
              <div
                onClick={()=>fileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                {file ? (
                  <div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <p className="text-sm font-medium text-blue-700">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size/1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Click to upload bill</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF — max 10MB</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use a clear, well-lit photo for best results</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)} />
            </div>

            {state === 'uploading' && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex justify-between text-xs text-blue-700 font-medium mb-2">
                  <span>{step || 'Processing...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {err && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-700">{err}</div>
            )}

            <button type="submit" disabled={!file || !clientId || state==='uploading'} className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {state === 'uploading' ? 'Processing...' : 'Upload & Extract Data'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
