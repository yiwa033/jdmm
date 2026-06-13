import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { pin, salt } = await request.json()
    if (!pin || !salt) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    // Check if password already exists
    const existing = await db.appPassword.findFirst()
    if (existing) {
      return NextResponse.json({ error: '密码已设置' }, { status: 400 })
    }

    const entry = await db.appPassword.create({
      data: { passwordHash: pin, keySalt: salt },
    })
    return NextResponse.json({ success: true, id: entry.id })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: '设置失败' }, { status: 500 })
  }
}
