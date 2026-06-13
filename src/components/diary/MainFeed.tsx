'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, X, Pin } from 'lucide-react'
import DiaryCard from './DiaryCard'
import DailyGreeting from './DailyGreeting'
import FeedSkeleton from './FeedSkeleton'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import ImageViewer from './ImageViewer'
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
  recordedAt: string
  isPinned: boolean
  tags: string[]
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
  onPinEntry: (id: string, pinned: boolean) => void
  refreshTrigger: number
}

export default function MainFeed({ cryptoKey, onNewEntry, onDeleteEntry, onEditEntry, onPinEntry, refreshTrigger }: MainFeedProps) {
  const [entries, setEntries] = useState<DecryptedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [viewImage, setViewImage] = useState<string | null>(null)

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
              isPinned: entry.isPinned || false,
              tags: content.tags || [],
            })
          } catch (e) {
            console.error('Failed to decrypt entry:', entry.id, e)
          }
        }
        // Sort: pinned first, then by date
        decrypted.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
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

  const handlePin = async (id: string, pinned: boolean) => {
    try {
      await fetch(`/api/diary/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: pinned }),
      })
      setEntries((prev) =>
        prev
          .map((e) => (e.id === id ? { ...e, isPinned: pinned } : e))
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
      )
      onPinEntry(id, pinned)
    } catch (e) {
      console.error('Pin failed:', e)
    }
  }

  // Filter by search query
  const filtered = searchQuery.trim()
    ? entries.filter((e) => {
        const q = searchQuery.toLowerCase()
        return (
          e.text.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)) ||
          (e.mood && e.mood.includes(q))
        )
      })
    : entries

  // Group entries by date
  const pinnedEntries = filtered.filter((e) => e.isPinned)
  const unpinnedEntries = filtered.filter((e) => !e.isPinned)

  const grouped: Record<string, DecryptedEntry[]> = {}
  unpinnedEntries.forEach((e) => {
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
      <div className="flex-1 overflow-y-auto pb-24">
        <FeedSkeleton />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Daily Greeting */}
      <div className="px-4 pt-3">
        <DailyGreeting />
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-2 pb-1">
        {showSearch ? (
          <div className="flex items-center gap-2 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 px-3 py-2">
            <Search className="w-4 h-4 text-[#B8A8AC] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索日记内容、标签..."
              className="flex-1 bg-transparent text-sm text-[#3D2C2E] dark:text-[#F5E6D3] placeholder:text-[#C8B8BC] outline-none"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#B8A8AC]">
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="text-xs text-[#9B8A8E] ml-1">
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 w-full bg-white/50 dark:bg-[#2A1F1E]/50 rounded-xl border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 px-3 py-2.5 text-sm text-[#C8B8BC]"
          >
            <Search className="w-4 h-4" />
            搜索日记...
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6">
          <div className="w-24 h-24 rounded-full bg-[#FFF0F5] dark:bg-[#3A2028] flex items-center justify-center">
            <span className="text-4xl">{searchQuery ? '🔍' : '🌙'}</span>
          </div>
          <p className="text-[#9B8A8E] dark:text-[#A89890] text-center">
            {searchQuery ? `没有找到"${searchQuery}"相关日记` : '还没有记录哦~'}
            <br />
            {!searchQuery && <span className="text-sm">点击下方按钮，记录此刻的心情</span>}
          </p>
          {!searchQuery && (
            <button
              onClick={onNewEntry}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-2xl shadow-lg shadow-[#E8A0BF]/20 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              记录这一刻
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 pt-2 space-y-6">
          {/* Pinned Section */}
          {pinnedEntries.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Pin className="w-3.5 h-3.5 text-[#F2C57C]" />
                <span className="text-xs text-[#F2C57C] font-medium">置顶</span>
                <div className="h-px flex-1 bg-[#F2C57C]/30" />
              </div>
              <div className="space-y-3">
                {pinnedEntries.map((entry) => (
                  <DiaryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => setDeleteTarget(id)}
                    onEdit={onEditEntry}
                    onPin={handlePin}
                    onImageClick={(url) => setViewImage(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Date Grouped Entries */}
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-[#E8D5DE]/50 dark:bg-[#4A3540]/50" />
                <span className="text-xs text-[#B8A8AC] dark:text-[#6A5A5E]">{date}</span>
                <div className="h-px flex-1 bg-[#E8D5DE]/50 dark:bg-[#4A3540]/50" />
              </div>
              <div className="space-y-3">
                {items.map((entry) => (
                  <DiaryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => setDeleteTarget(id)}
                    onEdit={onEditEntry}
                    onPin={handlePin}
                    onImageClick={(url) => setViewImage(url)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Image Viewer */}
      <ImageViewer
        open={!!viewImage}
        imageUrl={viewImage || ''}
        onClose={() => setViewImage(null)}
      />
    </div>
  )
}
