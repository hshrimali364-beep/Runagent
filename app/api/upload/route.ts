import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { extractInvoiceData } from '@/lib/ocr'
import sharp from 'sharp'

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

// Compress image using sharp — max 1200px width, quality 80, convert to jpeg
async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer, type: string }> {
  if (mimeType === 'application/pdf') return { buffer, type: mimeType }
  try {
    const compressed = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true }) // max 1200px, smaller images stay as-is
      .jpeg({ quality: 80 })
      .toBuffer()
    return { buffer: compressed, type: 'image/jpeg' }
  } catch {
    return { buffer, type: mimeType } // fallback to original if compression fails
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const token = formData.get('token') as string | null
    const firmId = formData.get('firm_id') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, PDF allowed' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max file size 10MB' }, { status: 400 })

    const admin = createAdminClient()
    let resolvedFirmId = firmId
    let resolvedClientId: string | null = null
    let caEmail: string | null = null

    // If no token and no firmId — resolve from auth session (dashboard upload)
    if (!token && !firmId) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const { data: firmRow } = await supabase.from('firms').select('id').eq('user_id', user.id).single()
      if (!firmRow) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
      resolvedFirmId = firmRow.id
    }

    // Resolve via upload token
    if (token) {
      const { data: tk } = await admin.from('upload_tokens')
        .select('*, clients(*), firms(id, used_credits, total_credits, is_active, email)')
        .eq('token', token).eq('is_active', true).maybeSingle()

      if (!tk) return NextResponse.json({ error: 'Invalid or expired upload link.' }, { status: 403 })
      if (new Date(tk.expires_at) < new Date()) return NextResponse.json({ error: 'Upload link expired. Contact your CA.' }, { status: 403 })

      resolvedFirmId = tk.firm_id
      resolvedClientId = tk.client_id
      caEmail = tk.firms?.email ?? null
    }

    if (!resolvedFirmId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check credits
    const { data: firm } = await admin.from('firms')
      .select('used_credits, total_credits, is_active, email, firm_name').eq('id', resolvedFirmId).single()
    if (!firm) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
    if (!firm.is_active) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    if (firm.used_credits >= firm.total_credits) return NextResponse.json({ error: 'CREDITS_EXHAUSTED', code: 'CREDITS_EXHAUSTED' }, { status: 429 })

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Compress image if not PDF (badi photos → choti size, max 1200px, quality 80)
    const { buffer: fileBuffer, type: finalType } = await compressImage(rawBuffer, file.type)

    const ts = Date.now()
    const baseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const safeName = finalType === 'image/jpeg' && file.type !== 'image/jpeg' && file.type !== 'image/jpg'
      ? baseName.replace(/\.[^.]+$/, '.jpg')
      : baseName
    const storagePath = `${resolvedFirmId}/${ts}_${safeName}`

    // Upload to Supabase Storage
    let fileUrl: string | null = null
    try {
      const { data: up } = await admin.storage.from('bills').upload(storagePath, fileBuffer, { contentType: finalType })
      if (up) {
        const { data: pub } = admin.storage.from('bills').getPublicUrl(storagePath)
        fileUrl = pub.publicUrl
      }
    } catch { /* storage optional */ }

    // Run OCR (use compressed buffer & finalType so OCR gets correct format)
    let ocrResult = null
    let ocrError: string | null = null
    try {
      ocrResult = await extractInvoiceData(fileBuffer, safeName, finalType)
    } catch (e: unknown) {
      ocrError = e instanceof Error ? e.message : 'OCR failed'
    }

    // Save invoice
    const { data: invoice, error: dbErr } = await admin.from('invoices').insert({
      firm_id: resolvedFirmId,
      client_id: resolvedClientId,
      original_file_url: fileUrl,
      file_name: safeName,
      file_type: finalType,
      ocr_raw: ocrResult,
      invoice_number: ocrResult?.invoice_number || null,
      invoice_date: ocrResult?.invoice_date || null,
      vendor_name: ocrResult?.vendor_name || null,
      gstin: ocrResult?.gstin || null,
      hsn_code: ocrResult?.hsn_code || null,
      taxable_amount: ocrResult?.taxable_amount || 0,
      cgst: ocrResult?.cgst || 0,
      sgst: ocrResult?.sgst || 0,
      igst: ocrResult?.igst || 0,
      total_amount: ocrResult?.total_amount || 0,
      ocr_confidence: ocrResult?.confidence || null,
      line_items: ocrResult?.line_items ? JSON.stringify(ocrResult.line_items) : null,
      status: ocrError ? 'review' : 'pending',
      uploaded_by: token ? 'client' : 'ca',
    }).select().single()

    if (dbErr) return NextResponse.json({ error: 'Failed to save invoice' }, { status: 500 })

    // Deduct credit
    await admin.from('firms').update({ used_credits: firm.used_credits + 1 }).eq('id', resolvedFirmId)

    // Log usage
    await admin.from('usage_logs').insert({
      firm_id: resolvedFirmId, invoice_id: invoice.id,
      action: 'bill_uploaded',
      meta: { file_name: file.name, ocr_success: !ocrError, client_upload: !!token },
    })

    // Notify CA firm via email when client uploads (only if we have caEmail)
    if (token && caEmail) {
      try {
        const { sendBillUploadNotification } = await import('@/lib/email')
        await sendBillUploadNotification(caEmail, firm.firm_name, resolvedClientId ?? 'Client', 1)
      } catch { /* non-critical, don't fail upload */ }
    }

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      ocr_data: ocrResult,
      ocr_error: ocrError,
      credits_remaining: firm.total_credits - firm.used_credits - 1,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
