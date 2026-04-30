export type PlanId = 'free' | 'starter' | 'growth' | 'pro' | 'firm'

export interface Plan {
  id: PlanId; name: string; price: number; bill_credits: number; description: string; is_active: boolean; created_at: string
}
export interface AccessRequest {
  id: string; full_name: string; firm_name: string; email: string; mobile: string
  city: string; monthly_volume: string; status: 'pending'|'approved'|'rejected'
  admin_note?: string; created_at: string; reviewed_at?: string
}
export interface Firm {
  id: string; user_id: string; firm_name: string; owner_name: string; email: string
  mobile?: string; city?: string; plan_id: PlanId; total_credits: number; used_credits: number
  is_active: boolean; trial_ends_at: string; created_at: string
}
export interface Client {
  id: string; firm_id: string; name: string; mobile?: string; notes?: string
  bill_limit?: number; is_active: boolean; created_at: string
  upload_tokens?: { token: string; is_active: boolean; expires_at: string }[]
}
export interface UploadToken {
  id: string; client_id: string; firm_id: string; token: string
  expires_at: string; is_active: boolean; created_at: string
}
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
export interface Invoice {
  id: string; firm_id: string; client_id?: string; original_file_url?: string
  file_name?: string; file_type?: string; ocr_raw?: Record<string,unknown>
  invoice_number?: string; invoice_date?: string; vendor_name?: string
  gstin?: string; hsn_code?: string; description?: string
  taxable_amount: number; cgst: number; sgst: number; igst: number; total_amount: number
  status: 'pending'|'approved'|'rejected'|'review'; ocr_confidence?: number
  line_items?: LineItem[]
  uploaded_by: string; created_at: string; updated_at: string
  client?: { id: string; name: string }
}
export interface Payment {
  id: string; firm_id: string; razorpay_order_id?: string; razorpay_payment_id?: string
  razorpay_signature?: string; plan_id: PlanId; amount: number; currency: string
  status: 'created'|'paid'|'failed'; method?: string; created_at: string
}
export interface OcrResult {
  invoice_number?: string
  invoice_date?: string
  vendor_name?: string
  gstin?: string
  hsn_code?: string
  description?: string
  taxable_amount?: number
  cgst?: number
  sgst?: number
  igst?: number
  total_amount?: number
  confidence?: number
  confidence_level?: 'high' | 'medium' | 'low'
  line_items?: LineItem[]
  raw_text?: string
  parsed_json?: Record<string, unknown>
}
