'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Calendar } from 'lucide-react'
import { decrypt } from '@/lib/crypto'
import { MOODS, type MoodValue } from './Selectors'

interface MoodEntry {
  date: string
  mood: MoodValue | ''
  text: string
}

interface MoodTrendProps {
  cryptoKey: CryptoKey
}

// Mood score for visualization: 1=worst → 8=best
const MOOD_SCORE: Record<string, number> = {
  anxious: 1,
  angry: 2,
  sad: 3,
  tired: 4,
  thinking: 5,
  calm: 6,
  happy: 7,
  lovely: 8,
}

const MOOD_COLORS: Record<string, string> = {
  anxious: '#B8A8AC',
  angry: '#E57373',
  sad: '#90CAF9',
  tired: '#CE93D8',
  thinking: '#FFD54F',
  calm: '#A5D6A7',
  happy: '#FFB74D',
  lovely: '#E8A0BF',
}

export default function MoodTrend({ cryptoKey }: MoodTrendProps) {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<7 | 14 | 30>(14)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/diary')
        const data = await res.json()
        if (cancelled) return
        const decoded: MoodEntry[] = []
        for (const entry of data) {
          try {
            const contentJson = await decrypt(entry.encryptedContent, cryptoKey)
            const content = JSON.parse(contentJson)
            if (content.mood) {
              decoded.push({
                date: entry.entryDate,
                mood: content.mood,
                text: (content.text || '').slice(0, 30),
              })
            }
          } catch {
            // skip
          }
        }
        if (!cancelled) setEntries(decoded)
      } catch (e) {
        console.error('Load mood data failed:', e)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [cryptoKey])

  // Filter entries by period
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - period)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const filtered = entries.filter((e) => e.date >= cutoffStr)

  // Group by date, take latest mood per day
  const dailyMoods: Record<string, MoodValue> = {}
  filtered.forEach((e) => {
    dailyMoods[e.date] = e.mood
  })

  // Sort by date
  const sortedDays = Object.entries(dailyMoods).sort((a, b) => a[0].localeCompare(b[0]))

  // Mood distribution
  const moodCounts: Record<string, number> = {}
  filtered.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
    }
  })

  const maxCount = Math.max(...Object.values(moodCounts), 1)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pb-24">
        <div className="text-[#E8A0BF] animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#E8A0BF]" />
          <h2 className="text-lg font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">心情趋势</h2>
        </div>
        <div className="flex gap-1">
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
      </div>

      {/* Mood Trend Chart */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <h3 className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3] mb-3">心情变化</h3>
        {sortedDays.length === 0 ? (
          <p className="text-sm text-[#B8A8AC] text-center py-8">暂无数据，记录心情后这里会显示趋势</p>
        ) : (
          <div className="relative">
            {/* Y axis labels */}
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-[#B8A8AC]">
              <span>😊</span>
              <span>😌</span>
              <span>🤔</span>
              <span>😢</span>
            </div>
            {/* Chart area */}
            <div className="ml-10">
              {/* Grid lines */}
              <div className="relative h-32">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-[#E8D5DE]/30 dark:border-[#4A3540]/30"
                    style={{ top: `${(i / 5) * 100}%` }}
                  />
                ))}
                {/* Data points and line */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  {/* Line */}
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
                {/* Data points */}
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
              {/* X axis dates */}
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
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
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
