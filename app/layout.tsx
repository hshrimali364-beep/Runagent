import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RunAgent — Bill Collection & OCR for CA Firms',
  description: 'Collect bills from clients, extract invoice data automatically, export to Excel or Tally. Built for Indian CA firms.',
  keywords: 'CA firm bill collection, OCR invoice, Tally export, GST invoice, accounting India',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
