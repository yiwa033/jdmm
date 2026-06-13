'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import DiaryCard from './DiaryCard'
import { decrypt } from '@/lib/crypto'
import type { MoodValue, WeatherValue } from './Selectors'

interface DecryptedEntry {
  id: string
  text: string
  mood: MoodValue | ''
  weather: WeatherValue | ''
  temperature: string
  hasImage: boolean
  imageUrl: string
  entryDate: string
  createdAt: string
  recordedAt: string // precise timestamp from client
}

interface MainFeedProps {
  cryptoKey: CryptoKey
  onNewEntry: () => void
  onDeleteEntry: (id: string) => void
  onEditEntry: (entry: {
    id: string
    text: string
    mood: MoodValue | ''
    weather: WeatherValue | ''
    temperature: string
  }) => void
  refreshTrigger: number
}

export default function MainFeed({ cryptoKey, onNewEntry, onDeleteEntry, onEditEntry, refreshTrigger }: MainFeedProps) {
  const [entries, setEntries] = useState<DecryptedEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/diary')
        const data = await res.json()
        if (cancelled) return
        const decrypted: DecryptedEntry[] = []
        for (const entry of data) {
          try {
            const contentJson = await decrypt(entry.encryptedContent, cryptoKey)
            const content = JSON.parse(contentJson)
            let imageUrl = ''
            if (entry.encryptedImage) {
              try {
                imageUrl = await decrypt(entry.encryptedImage, cryptoKey)
              } catch {
                // skip
              }
            }
            decrypted.push({
              id: entry.id,
              text: content.text || '',
              mood: content.mood || '',
              weather: content.weather || '',
              temperature: content.temperature || '',
              hasImage: !!entry.encryptedImage,
              imageUrl,
              entryDate: entry.entryDate,
              createdAt: entry.createdAt,
              recordedAt: content.recordedAt || entry.createdAt,
            })
          } catch (e) {
            console.error('Failed to decrypt entry:', entry.id, e)
          }
        }
        if (!cancelled) setEntries(decrypted)
      } catch (e) {
        console.error('Failed to load entries:', e)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [cryptoKey, refreshTrigger])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/diary/${id}`, { method: 'DELETE' })
      setEntries(entries.filter((e) => e.id !== id))
      onDeleteEntry(id)
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  // Group entries by date
  const grouped: Record<string, DecryptedEntry[]> = {}
  entries.forEach((e) => {
    const date = new Date(e.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(e)
  })

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[#E8A0BF] animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
          <div className="w-24 h-24 rounded-full bg-[#FFF0F5] dark:bg-[#3A2028] flex items-center justify-center">
            <span className="text-4xl">🌙</span>
          </div>
          <p className="text-[#9B8A8E] dark:text-[#A89890] text-center">
            还没有记录哦~<br />
            <span className="text-sm">点击下方按钮，记录此刻的心情</span>
          </p>
          <button
            onClick={onNewEntry}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-2xl shadow-lg shadow-[#E8A0BF]/20 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
            记录这一刻
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-[#E8D5DE]/50 dark:bg-[#4A3540]/50" />
                <span className="text-xs text-[#B8A8AC] dark:text-[#6A5A5E]">{date}</span>
                <div className="h-px flex-1 bg-[#E8D5DE]/50 dark:bg-[#4A3540]/50" />
              </div>
              <div className="space-y-3">
                {items.map((entry) => (
                  <DiaryCard key={entry.id} entry={entry} onDelete={handleDelete} onEdit={onEditEntry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
