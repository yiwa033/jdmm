import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()
    if (!pin) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const existing = await db.appPassword.findFirst()
    if (!existing) {
      return NextResponse.json({ valid: false, error: '未设置密码' }, { status: 404 })
    }

    // Check real password
    if (existing.passwordHash === pin) {
      return NextResponse.json({ valid: true, mode: 'real', salt: existing.keySalt })
    }

    // Check decoy (fake) password
    if (existing.decoyPasswordHash && existing.decoyPasswordHash === pin) {
      return NextResponse.json({ valid: true, mode: 'decoy', salt: existing.decoyKeySalt })
    }

    return NextResponse.json({ valid: false })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: '验证失败' }, { status: 500 })
  }
}
