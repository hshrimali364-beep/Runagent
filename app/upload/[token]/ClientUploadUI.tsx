'use client'
import { useState, useRef } from 'react'

interface Props {
  token: string
  clientName: string
  firmName: string
  billLimit: number | null
  uploadCount: number
  isAtLimit: boolean
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

const STEPS = ['Optimizing image…', 'Uploading file…', 'Running OCR…', 'Extracting data…', 'Saving invoice…']

export default function ClientUploadUI({ token, clientName, firmName, billLimit, uploadCount, isAtLimit }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [stepIdx, setStepIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [totalUploaded, setTotalUploaded] = useState(uploadCount)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { setErr('File too large. Max 10MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(f.type)) {
      setErr('Only JPG, PNG, PDF files allowed.'); return
    }
    setErr('')
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const upload = async () => {
    if (!file) return
    setState('uploading'); setProgress(5); setStepIdx(0); setErr('')

    const interval = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + 7, 88)
        setStepIdx(Math.floor((next / 90) * STEPS.length))
        return next
      })
    }, 700)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('token', token)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      clearInterval(interval)
      setProgress(100)

      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Upload failed. Please try again.')
        setState('error')
        return
      }
      setTotalUploaded(t => t + 1)
      setState('done')
    } catch {
      clearInterval(interval)
      setErr('Network error. Please check your connection and try again.')
      setState('error')
    }
  }

  const reset = () => {
    setState('idle'); setFile(null); setPreview(null); setProgress(0); setStepIdx(0); setErr('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-5 text-center">
          <div className="font-bold text-white text-lg">Run<span className="text-blue-400">Agent</span></div>
          <p className="text-gray-400 text-xs mt-0.5">Secure bill upload</p>
        </div>

        <div className="p-6">
          {/* Client info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Requested by</p>
            <p className="font-bold text-gray-900">{firmName}</p>
            <p className="text-sm text-gray-500 mt-0.5">For: <strong>{clientName}</strong></p>
            {billLimit && (
              <p className="text-xs text-gray-400 mt-1">{totalUploaded} / {billLimit} bills uploaded</p>
            )}
          </div>

          {isAtLimit ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🚫</div>
              <h2 className="font-bold text-gray-900 mb-2">Upload Limit Reached</h2>
              <p className="text-sm text-gray-500">You&apos;ve reached the maximum bill limit. Contact {firmName} for assistance.</p>
            </div>
          ) : state === 'done' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Bill Uploaded!</h2>
              <p className="text-sm text-gray-500 mb-6">Your CA firm will process it shortly. Thank you!</p>
              <button onClick={reset} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
                Upload Another Bill
              </button>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) pickFile(f) }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain mb-2" />
                ) : (
                  <div className="text-4xl mb-3">{file?.type === 'application/pdf' ? '📄' : '📷'}</div>
                )}
                {file ? (
                  <>
                    <p className="font-medium text-blue-700 text-sm">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB · Tap to change</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-700 text-sm">Tap to upload bill photo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG · PNG · PDF (max 10MB)</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
              />

              {/* Progress */}
              {state === 'uploading' && (
                <div className="mb-4 bg-blue-50 rounded-xl p-4">
                  <div className="flex justify-between text-xs text-blue-700 font-medium mb-2">
                    <span>{STEPS[Math.min(stepIdx, STEPS.length - 1)]}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {err && (
                <div className="mb-4 bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">
                  {state === 'error' && <button onClick={reset} className="float-right text-red-400 hover:text-red-600">✕</button>}
                  {err}
                </div>
              )}

              <button
                onClick={upload}
                disabled={!file || state === 'uploading'}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base"
              >
                {state === 'uploading' ? 'Processing…' : 'Upload Bill'}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Secure upload · Data visible only to {firmName}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
