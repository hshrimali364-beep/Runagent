import { createAdminClient } from '@/lib/supabase/server'
import ClientUploadUI from './ClientUploadUI'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function UploadTokenPage({ params }: PageProps) {
  const { token } = await params
  const admin = createAdminClient()

  // Validate token
  const { data: tokenRow } = await admin
    .from('upload_tokens')
    .select('*, clients(id, name, bill_limit), firms(firm_name, owner_name)')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle()

  if (!tokenRow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500 text-sm">This upload link is invalid or has been disabled. Please contact your CA firm for a new link.</p>
        </div>
      </div>
    )
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-500 text-sm">This upload link has expired. Please ask your CA to send you a new link.</p>
        </div>
      </div>
    )
  }

  // Count existing uploads for this client
  const { count: uploadCount } = await admin
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', tokenRow.client_id)

  const billLimit = (tokenRow.clients as Record<string, unknown>)?.bill_limit as number | null
  const isAtLimit = billLimit !== null && (uploadCount || 0) >= billLimit

  return (
    <ClientUploadUI
      token={token}
      clientName={(tokenRow.clients as Record<string, unknown>)?.name as string || 'Client'}
      firmName={(tokenRow.firms as Record<string, unknown>)?.firm_name as string || 'Your CA Firm'}
      billLimit={billLimit}
      uploadCount={uploadCount || 0}
      isAtLimit={isAtLimit}
    />
  )
}
