import type { OcrResult } from '@/lib/types'

const OCR_API_KEY  = process.env.OCR_SPACE_API_KEY!
const GROQ_API_KEY = process.env.GROQ_API_KEY!
const OCR_API_URL  = 'https://api.ocr.space/parse/image'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface LineItem {
  description: string
  hsn_code?: string
  quantity?: number
  unit?: string
  rate?: number
  gst_percent?: number
  taxable_amount: number
  cgst: number
  sgst: number
  igst: number
  total_amount: number
}

// STEP 1: Extract raw text from image using OCR.space
async function runOCR(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const form = new FormData()
  form.append('apikey',            OCR_API_KEY)
  form.append('language',          'eng')
  form.append('isOverlayRequired', 'false')
  form.append('detectOrientation', 'true')
  form.append('scale',             'true')
  form.append('isTable',           'true')
  form.append('OCREngine',         '2')
  form.append('filetype', mimeType === 'application/pdf' ? 'PDF' : 'JPG')

  const contentType = mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg'
  form.append('file', new Blob([new Uint8Array(fileBuffer)], { type: contentType }), fileName)

  const resp = await fetch(OCR_API_URL, { method: 'POST', body: form })
  if (!resp.ok) throw new Error(`OCR.space HTTP error: ${resp.status}`)

  const json = await resp.json()
  if (json.IsErroredOnProcessing)
    throw new Error(json.ErrorMessage?.[0] || 'OCR processing failed')

  const raw: string = json.ParsedResults?.[0]?.ParsedText || ''
  if (!raw || raw.trim().length < 20)
    throw new Error('OCR returned empty or unclear text. Please upload a clearer image.')

  return raw
}

// STEP 2: Parse raw OCR text using Groq LLM
async function runGroq(rawText: string): Promise<Record<string, unknown>> {
  const prompt = `You are an expert Indian GST invoice parser.
Extract all invoice fields from the following OCR text and return ONLY a valid JSON object.

OCR TEXT:
${rawText}

Return ONLY this JSON format (no markdown, no explanation):
{
  "vendor_name": "",
  "vendor_gstin": "",
  "buyer_name": "",
  "buyer_gstin": "",
  "invoice_no": "",
  "invoice_date": "",
  "place_of_supply": "",
  "subtotal": 0,
  "cgst": 0,
  "sgst": 0,
  "igst": 0,
  "discount": 0,
  "round_off": 0,
  "grand_total": 0,
  "items": [
    {
      "name": "",
      "hsn": "",
      "qty": 0,
      "unit": "",
      "rate": 0,
      "gst_percent": 0,
      "amount": 0
    }
  ]
}

Rules:
- vendor_name = seller/supplier company name (at top of bill)
- buyer_name = purchaser/client name (M/s. or buyer section)
- Extract EVERY line item separately with correct qty, rate, amount
- All numeric fields must be numbers not strings
- invoice_date format: DD/MM/YYYY
- If field not found use empty string or 0
- Return ONLY JSON, nothing else`

  const resp = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens:  2000,
      messages: [
        { role: 'system', content: 'You are an expert Indian GST invoice data extractor. Return only valid JSON.' },
        { role: 'user',   content: prompt },
      ],
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Groq API error: ${resp.status} — ${err.substring(0, 200)}`)
  }

  const json = await resp.json()
  const text = json.choices?.[0]?.message?.content || ''

  // Clean and parse JSON
  const clean = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    return JSON.parse(clean)
  } catch {
    // Try to extract JSON from response
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Groq returned invalid JSON: ' + clean.substring(0, 200))
  }
}

// Calculate confidence score
function calcConfidence(parsed: Record<string, unknown>, rawText: string): { score: number; level: 'high' | 'medium' | 'low' } {
  let score = 0
  if (parsed.vendor_name)  score += 20
  if (parsed.vendor_gstin) score += 15
  if (parsed.invoice_no)   score += 15
  if (parsed.invoice_date) score += 10
  if (parsed.grand_total && Number(parsed.grand_total) > 0) score += 20
  if (parsed.cgst || parsed.sgst || parsed.igst) score += 10
  if (Array.isArray(parsed.items) && parsed.items.length > 0) score += 10

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  return { score, level }
}

// MAIN: Hybrid OCR + Groq pipeline
export async function extractInvoiceData(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<OcrResult> {

  // STEP 1: OCR.space
  let rawText = ''
  try {
    rawText = await runOCR(fileBuffer, fileName, mimeType)
  } catch (e: unknown) {
    throw new Error(`OCR failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // STEP 2: Groq LLM parsing
  let parsed: Record<string, unknown>
  try {
    parsed = await runGroq(rawText)
  } catch (e: unknown) {
    throw new Error(`AI parsing failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // STEP 3: Map Groq output to our format
  const items = Array.isArray(parsed.items) ? parsed.items : []
  const lineItems: LineItem[] = items.map((item: Record<string, unknown>) => {
    const qty    = Number(item.qty)    || 0
    const rate   = Number(item.rate)   || 0
    const amount = Number(item.amount) || qty * rate
    const gstPct = Number(item.gst_percent) || 0
    const taxable = gstPct > 0 ? amount / (1 + gstPct / 100) : amount
    const gstAmt  = amount - taxable
    const cgst    = gstAmt / 2
    const sgst    = gstAmt / 2

    return {
      description:    String(item.name || ''),
      hsn_code:       String(item.hsn  || ''),
      quantity:       qty  || undefined,
      unit:           String(item.unit || '') || undefined,
      rate:           rate || undefined,
      gst_percent:    gstPct || undefined,
      taxable_amount: Math.round(taxable * 100) / 100,
      cgst:           Math.round(cgst * 100) / 100,
      sgst:           Math.round(sgst * 100) / 100,
      igst:           0,
      total_amount:   Math.round(amount * 100) / 100,
    }
  })

  const confidence = calcConfidence(parsed, rawText)

  // Warning if image is unclear
  if (confidence.level === 'low') {
    console.warn('Low confidence OCR result — user should upload clearer image')
  }

  return {
    invoice_number:  String(parsed.invoice_no    || ''),
    invoice_date:    String(parsed.invoice_date  || ''),
    vendor_name:     String(parsed.vendor_name   || ''),
    gstin:           String(parsed.vendor_gstin  || ''),
    hsn_code:        lineItems[0]?.hsn_code      || '',
    taxable_amount:  Number(parsed.subtotal)     || 0,
    cgst:            Number(parsed.cgst)         || 0,
    sgst:            Number(parsed.sgst)         || 0,
    igst:            Number(parsed.igst)         || 0,
    total_amount:    Number(parsed.grand_total)  || 0,
    line_items:      lineItems,
    confidence:      confidence.score,
    confidence_level: confidence.level,
    raw_text:        rawText,
    parsed_json:     parsed,
  }
}
