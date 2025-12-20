import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const cookiesArray = req.cookies.getAll()
    const cookies = Object.fromEntries(cookiesArray.map(c => [c.name, c.value]))
    console.log('[Debug] /api/debug/session request cookies:', cookies)
    console.log('[Debug] /api/debug/session token:', token)
    return NextResponse.json({ ok: true, token: token ?? null, cookies })
  } catch (e: any) {
    console.error('[Debug] error in /api/debug/session', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
