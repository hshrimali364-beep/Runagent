import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_session', process.env.ADMIN_SECRET!, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 60 * 60 * 24, path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_session')
  return res
}
