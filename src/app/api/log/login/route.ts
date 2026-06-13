import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Get login history (most recent 50)
export async function GET() {
  try {
    const logs = await db.loginLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    // Also get open count from AppPassword
    const appPwd = await db.appPassword.findFirst()
    const openCount = appPwd?.openCount || 0
    return NextResponse.json({ logs, openCount })
  } catch (error) {
    console.error('Get login logs error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// Record a login event
export async function POST(request: Request) {
  try {
    const { success } = await request.json()

    // Get IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create log entry
    await db.loginLog.create({
      data: {
        ip,
        userAgent,
        success: success !== false,
      },
    })

    // If successful login, increment open count
    if (success !== false) {
      const appPwd = await db.appPassword.findFirst()
      if (appPwd) {
        await db.appPassword.update({
          where: { id: appPwd.id },
          data: { openCount: appPwd.openCount + 1 },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Record login error:', error)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}
