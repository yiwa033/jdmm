import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const entries = await db.diaryEntry.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Get diary error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { encryptedContent, encryptedImage, entryDate } = await request.json()
    if (!encryptedContent || !entryDate) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const entry = await db.diaryEntry.create({
      data: { encryptedContent, encryptedImage: encryptedImage || null, entryDate },
    })
    return NextResponse.json(entry)
  } catch (error) {
    console.error('Create diary error:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
