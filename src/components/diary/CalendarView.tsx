'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { decrypt } from '@/lib/crypto'
import type { MoodValue, WeatherValue } from './Selectors'
import { MOODS, WEATHERS } from './Selectors'

interface DecodedEntry {
  id: string
  text: string
  mood: MoodValue | ''
  weather: WeatherValue | ''
  temperature: string
  createdAt: string
}

interface CalendarViewProps {
  cryptoKey: CryptoKey
}

export default function CalendarView({ cryptoKey }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayEntries, setDayEntries] = useState<DecodedEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Load entry dates on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/diary')
        const data = await res.json()
        if (cancelled) return
        const dates = new Set<string>()
        data.forEach((entry: { entryDate: string }) => dates.add(entry.entryDate))
        setEntryDates(dates)
      } catch (e) {
        console.error('Load dates failed:', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const loadDayEntries = async (dateStr: string) => {
    setSelectedDate(dateStr)
    setLoading(true)
    try {
      const res = await fetch('/api/diary')
      const data = await res.json()
      const decoded: DecodedEntry[] = []
      for (const entry of data) {
        if (entry.entryDate !== dateStr) continue
        try {
          const contentJson = await decrypt(entry.encryptedContent, cryptoKey)
          const content = JSON.parse(contentJson)
          decoded.push({
            id: entry.id,
            text: content.text || '',
            mood: content.mood || '',
            weather: content.weather || '',
            temperature: content.temperature || '',
            createdAt: entry.createdAt,
          })
        } catch {
          // skip
        }
      }
      decoded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setDayEntries(decoded)
    } catch (e) {
      console.error('Load day entries failed:', e)
    }
    setLoading(false)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-[#FFF0F5] dark:hover:bg-[#3A2028]">
          <ChevronLeft className="w-5 h-5 text-[#9B8A8E]" />
        </button>
        <h2 className="text-lg font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">
          {year}年 {monthNames[month]}
        </h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-[#FFF0F5] dark:hover:bg-[#3A2028]">
          <ChevronRight className="w-5 h-5 text-[#9B8A8E]" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs text-[#B8A8AC] dark:text-[#6A5A5E] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasEntry = entryDates.has(dateStr)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate

          return (
            <button
              key={day}
              onClick={() => loadDayEntries(dateStr)}
              className={`relative h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-[#E8A0BF] to-[#F2C57C] text-white'
                  : isToday
                  ? 'bg-[#FFF0F5] dark:bg-[#3A2028] text-[#E8A0BF] font-bold'
                  : 'text-[#3D2C2E] dark:text-[#F5E6D3] hover:bg-[#FFF0F5]/50 dark:hover:bg-[#3A2028]/50'
              }`}
            >
              <span className="text-sm">{day}</span>
              {hasEntry && !isSelected && (
                <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E8A0BF]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Day Entries */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#9B8A8E] dark:text-[#A89890]">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })} 的记录
          </h3>
          {loading ? (
            <p className="text-sm text-[#B8A8AC] animate-pulse">加载中...</p>
          ) : dayEntries.length === 0 ? (
            <p className="text-sm text-[#C8B8BC]">这天没有记录</p>
          ) : (
            dayEntries.map((entry) => {
              const mood = MOODS.find((m) => m.value === entry.mood)
              const weather = WEATHERS.find((w) => w.value === entry.weather)
              return (
                <div
                  key={entry.id}
                  className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {mood && <span>{mood.emoji}</span>}
                    {weather && <span className="text-xs text-[#9B8A8E]">{weather.label}</span>}
                    {entry.temperature && (
                      <span className="text-xs text-[#9B8A8E]">{entry.temperature}°C</span>
                    )}
                    <span className="text-xs text-[#B8A8AC] ml-auto">
                      {new Date(entry.createdAt).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })} {new Date(entry.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[#3D2C2E] dark:text-[#F5E6D3] text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.text}
                  </p>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
