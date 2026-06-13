import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.diaryEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete diary error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    if (body.encryptedContent !== undefined) updateData.encryptedContent = body.encryptedContent
    if (body.encryptedImage !== undefined) updateData.encryptedImage = body.encryptedImage || null
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned

    const entry = await db.diaryEntry.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(entry)
  } catch (error) {
    console.error('Update diary error:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
