'use client'

import { Heart, Sun, Cloud, CloudRain, Snowflake, Wind } from 'lucide-react'

export const MOODS = [
  { emoji: '😊', label: '开心', value: 'happy' },
  { emoji: '😌', label: '平静', value: 'calm' },
  { emoji: '😢', label: '难过', value: 'sad' },
  { emoji: '😤', label: '生气', value: 'angry' },
  { emoji: '🥰', label: '幸福', value: 'lovely' },
  { emoji: '😰', label: '焦虑', value: 'anxious' },
  { emoji: '😴', label: '疲惫', value: 'tired' },
  { emoji: '🤔', label: '思考', value: 'thinking' },
] as const

export const WEATHERS = [
  { icon: Sun, label: '晴', value: 'sunny' },
  { icon: Cloud, label: '多云', value: 'cloudy' },
  { icon: CloudRain, label: '雨', value: 'rainy' },
  { icon: Snowflake, label: '雪', value: 'snowy' },
  { icon: Wind, label: '风', value: 'windy' },
] as const

export type MoodValue = (typeof MOODS)[number]['value']
export type WeatherValue = (typeof WEATHERS)[number]['value']

interface MoodSelectorProps {
  value: MoodValue | ''
  onChange: (v: MoodValue) => void
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all active:scale-95 ${
            value === m.value
              ? 'bg-[#FFF0F5] dark:bg-[#3A2028] border-2 border-[#E8A0BF] text-[#3D2C2E] dark:text-[#F5E6D3]'
              : 'bg-white/60 dark:bg-[#2A1F1E]/60 border border-[#E8D5DE]/50 dark:border-[#4A3540]/50 text-[#9B8A8E] dark:text-[#A89890]'
          }`}
        >
          <span className="text-lg">{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}

interface WeatherSelectorProps {
  value: WeatherValue | ''
  onChange: (v: WeatherValue) => void
}

export function WeatherSelector({ value, onChange }: WeatherSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {WEATHERS.map((w) => (
        <button
          key={w.value}
          onClick={() => onChange(w.value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all active:scale-95 ${
            value === w.value
              ? 'bg-[#FFF8F0] dark:bg-[#3A3020] border-2 border-[#F2C57C] text-[#3D2C2E] dark:text-[#F5E6D3]'
              : 'bg-white/60 dark:bg-[#2A1F1E]/60 border border-[#E8D5DE]/50 dark:border-[#4A3540]/50 text-[#9B8A8E] dark:text-[#A89890]'
          }`}
        >
          <w.icon className="w-4 h-4" />
          <span>{w.label}</span>
        </button>
      ))}
    </div>
  )
}
