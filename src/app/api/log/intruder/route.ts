import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Get intruder photos
export async function GET() {
  try {
    const photos = await db.intruderPhoto.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(photos)
  } catch (error) {
    console.error('Get intruder photos error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// Save intruder photo
export async function POST(request: Request) {
  try {
    const { photoData, ip, userAgent } = await request.json()
    if (!photoData) {
      return NextResponse.json({ error: '缺少照片数据' }, { status: 400 })
    }
    const photo = await db.intruderPhoto.create({
      data: { photoData, ip: ip || 'unknown', userAgent: userAgent || 'unknown' },
    })
    return NextResponse.json({ success: true, id: photo.id })
  } catch (error) {
    console.error('Save intruder photo error:', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
