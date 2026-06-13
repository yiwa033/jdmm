import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { pin, salt, decoyPin, decoySalt } = await request.json()
    if (!pin || !salt) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const existing = await db.appPassword.findFirst()
    if (existing) {
      // Update: change password and optionally set decoy
      const updateData: Record<string, unknown> = {
        passwordHash: pin,
        keySalt: salt,
      }
      if (decoyPin !== undefined) updateData.decoyPasswordHash = decoyPin
      if (decoySalt !== undefined) updateData.decoyKeySalt = decoySalt

      await db.appPassword.update({
        where: { id: existing.id },
        data: updateData,
      })
      return NextResponse.json({ success: true })
    }

    // First time setup
    const entry = await db.appPassword.create({
      data: {
        passwordHash: pin,
        keySalt: salt,
        decoyPasswordHash: decoyPin || null,
        decoyKeySalt: decoySalt || null,
      },
    })
    return NextResponse.json({ success: true, id: entry.id })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: '设置失败' }, { status: 500 })
  }
}
