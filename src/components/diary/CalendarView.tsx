'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, Calendar } from 'lucide-react'
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

// Mood score for visualization: 1=worst → 8=best
const MOOD_SCORE: Record<string, number> = {
  anxious: 1, angry: 2, sad: 3, tired: 4,
  thinking: 5, calm: 6, happy: 7, lovely: 8,
}

const MOOD_COLORS: Record<string, string> = {
  anxious: '#B8A8AC', angry: '#E57373', sad: '#90CAF9', tired: '#CE93D8',
  thinking: '#FFD54F', calm: '#A5D6A7', happy: '#FFB74D', lovely: '#E8A0BF',
}

interface MoodEntry {
  date: string
  mood: MoodValue | ''
  text: string
}

export default function CalendarView({ cryptoKey }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayEntries, setDayEntries] = useState<DecodedEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [period, setPeriod] = useState<7 | 14 | 30>(14)

  // Load entry dates & mood data on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/diary')
        const data = await res.json()
        if (cancelled) return
        const dates = new Set<string>()
        const moods: MoodEntry[] = []
        for (const entry of data) {
          dates.add(entry.entryDate)
          try {
            const contentJson = await decrypt(entry.encryptedContent, cryptoKey)
            const content = JSON.parse(contentJson)
            if (content.mood) {
              moods.push({
                date: entry.entryDate,
                mood: content.mood,
                text: (content.text || '').slice(0, 30),
              })
            }
          } catch {
            // skip
          }
        }
        if (!cancelled) {
          setEntryDates(dates)
          setMoodEntries(moods)
        }
      } catch (e) {
        console.error('Load dates failed:', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [cryptoKey])

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

  // Mood trend calculations
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - period)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const filtered = moodEntries.filter((e) => e.date >= cutoffStr)

  const dailyMoods: Record<string, MoodValue> = {}
  filtered.forEach((e) => { dailyMoods[e.date] = e.mood })
  const sortedDays = Object.entries(dailyMoods).sort((a, b) => a[0].localeCompare(b[0]))

  const moodCounts: Record<string, number> = {}
  filtered.forEach((e) => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1 })
  const maxCount = Math.max(...Object.values(moodCounts), 1)

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
        <div className="space-y-3 mb-6">
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

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-[#E8D5DE]/50 dark:bg-[#4A3540]/50" />
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#E8A0BF]" />
          <span className="text-xs text-[#9B8A8E]">心情趋势</span>
        </div>
        <div className="h-px flex-1 bg-[#E8D5DE]/50 dark:bg-[#4A3540]/50" />
      </div>

      {/* Period Selector */}
      <div className="flex justify-center gap-1 mb-4">
        {[7, 14, 30].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as 7 | 14 | 30)}
            className={`px-3 py-1 rounded-lg text-xs transition-all ${
              period === p
                ? 'bg-[#E8A0BF] text-white'
                : 'bg-white/60 dark:bg-[#2A1F1E]/60 text-[#9B8A8E]'
            }`}
          >
            {p}天
          </button>
        ))}
      </div>

      {/* Mood Trend Chart */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 mb-4">
        <h3 className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3] mb-3">心情变化</h3>
        {sortedDays.length === 0 ? (
          <p className="text-sm text-[#B8A8AC] text-center py-8">暂无数据，记录心情后这里会显示趋势</p>
        ) : (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-[#B8A8AC]">
              <span>😊</span>
              <span>😌</span>
              <span>🤔</span>
              <span>😢</span>
            </div>
            <div className="ml-10">
              <div className="relative h-32">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-[#E8D5DE]/30 dark:border-[#4A3540]/30"
                    style={{ top: `${(i / 5) * 100}%` }}
                  />
                ))}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  {sortedDays.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#E8A0BF"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      points={sortedDays
                        .map((entry, i) => {
                          const x = (i / Math.max(sortedDays.length - 1, 1)) * 100
                          const score = MOOD_SCORE[entry[1]] || 5
                          const y = 100 - ((score - 1) / 7) * 100
                          return `${x}%,${y}%`
                        })
                        .join(' ')}
                    />
                  )}
                </svg>
                {sortedDays.map((entry, i) => {
                  const score = MOOD_SCORE[entry[1]] || 5
                  const x = (i / Math.max(sortedDays.length - 1, 1)) * 100
                  const y = 100 - ((score - 1) / 7) * 100
                  const mood = MOODS.find((m) => m.value === entry[1])
                  return (
                    <div
                      key={entry[0]}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 text-lg cursor-pointer hover:scale-125 transition-transform"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      title={`${entry[0]} ${mood?.label || ''}`}
                    >
                      {mood?.emoji || '●'}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-[#B8A8AC] mt-1">
                {sortedDays.length > 0 && (
                  <>
                    <span>{sortedDays[0][0].slice(5)}</span>
                    {sortedDays.length > 2 && (
                      <span>{sortedDays[Math.floor(sortedDays.length / 2)][0].slice(5)}</span>
                    )}
                    <span>{sortedDays[sortedDays.length - 1][0].slice(5)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mood Distribution */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 mb-4">
        <h3 className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3] mb-3">心情分布</h3>
        {Object.keys(moodCounts).length === 0 ? (
          <p className="text-sm text-[#B8A8AC] text-center py-4">暂无数据</p>
        ) : (
          <div className="space-y-2">
            {MOODS.filter((m) => moodCounts[m.value]).map((mood) => {
              const count = moodCounts[mood.value] || 0
              const pct = (count / maxCount) * 100
              return (
                <div key={mood.value} className="flex items-center gap-2">
                  <span className="text-lg w-8 text-center">{mood.emoji}</span>
                  <span className="text-xs text-[#9B8A8E] w-10">{mood.label}</span>
                  <div className="flex-1 h-5 bg-[#F5E6D3]/50 dark:bg-[#3A2A20]/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: MOOD_COLORS[mood.value] || '#E8A0BF',
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#9B8A8E] w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Mood Log */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-[#F2C57C]" />
          <h3 className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3]">最近心情</h3>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-[#B8A8AC] text-center py-4">暂无数据</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filtered.slice(0, 20).map((entry, i) => {
              const mood = MOODS.find((m) => m.value === entry.mood)
              return (
                <div
                  key={`${entry.date}-${i}`}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <span className="text-[#B8A8AC] font-mono tabular-nums text-xs">{entry.date.slice(5)}</span>
                  <span className="text-lg">{mood?.emoji}</span>
                  <span className="text-xs text-[#9B8A8E]">{mood?.label}</span>
                  {entry.text && (
                    <span className="text-xs text-[#C8B8BC] truncate flex-1">{entry.text}...</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
