'use client'

import { Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOODS, WEATHERS, type MoodValue, type WeatherValue } from './Selectors'

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
}

interface DiaryCardProps {
  entry: DecryptedEntry
  onDelete: (id: string) => void
  onEdit: (entry: {
    id: string
    text: string
    mood: MoodValue | ''
    weather: WeatherValue | ''
    temperature: string
  }) => void
}

export default function DiaryCard({ entry, onDelete, onEdit }: DiaryCardProps) {
  const mood = MOODS.find((m) => m.value === entry.mood)
  const weather = WEATHERS.find((w) => w.value === entry.weather)

  const dateObj = new Date(entry.recordedAt || entry.createdAt)
  const dateStr = dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = dateObj.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div className="bg-white/70 dark:bg-[#2A1F1E]/70 backdrop-blur-sm rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {mood && (
            <span className="text-xl" role="img" aria-label={mood.label}>
              {mood.emoji}
            </span>
          )}
          {mood && (
            <span className="text-sm text-[#9B8A8E] dark:text-[#A89890]">{mood.label}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#C8B8BC] hover:text-[#E8A0BF] hover:bg-[#FFF0F5] dark:hover:bg-[#3A2028]"
            onClick={() => onEdit({
              id: entry.id,
              text: entry.text,
              mood: entry.mood,
              weather: entry.weather,
              temperature: entry.temperature,
            })}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#C8B8BC] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <p className="text-[#3D2C2E] dark:text-[#F5E6D3] text-[15px] leading-relaxed whitespace-pre-wrap mb-3">
        {entry.text}
      </p>

      {/* Image */}
      {entry.hasImage && entry.imageUrl && (
        <div className="mb-3 rounded-xl overflow-hidden">
          <img
            src={entry.imageUrl}
            alt="日记图片"
            className="w-full max-h-80 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#B8A8AC] dark:text-[#6A5A5E]">
        <span>📅 {dateStr}</span>
        <span className="font-mono tabular-nums">🕐 {timeStr}</span>
        {weather && <span>{weather.label}</span>}
        {entry.temperature && <span>{entry.temperature}°C</span>}
      </div>
    </div>
  )
}
