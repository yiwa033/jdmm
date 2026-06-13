'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MoodSelector, WeatherSelector, type MoodValue, type WeatherValue } from './Selectors'
import { encrypt } from '@/lib/crypto'

// Open-Meteo weather code to our weather value mapping
function weatherCodeToValue(code: number): WeatherValue {
  if (code === 0) return 'sunny'
  if (code <= 3) return 'cloudy'
  if (code >= 45 && code <= 48) return 'cloudy'
  if (code >= 51 && code <= 67) return 'rainy'
  if (code >= 71 && code <= 77) return 'snowy'
  if (code >= 80 && code <= 82) return 'rainy'
  if (code >= 85 && code <= 86) return 'snowy'
  if (code >= 95) return 'rainy'
  return 'cloudy'
}

const WEATHER_LABELS: Record<WeatherValue, string> = {
  sunny: '晴',
  cloudy: '多云',
  rainy: '雨',
  snowy: '雪',
  windy: '风',
}

interface NewEntryProps {
  cryptoKey: CryptoKey
  onSubmitted: () => void
  onCancel: () => void
  editingEntry?: {
    id: string
    text: string
    mood: MoodValue | ''
    weather: WeatherValue | ''
    temperature: string
  } | null
}

export default function NewEntry({ cryptoKey, onSubmitted, onCancel, editingEntry }: NewEntryProps) {
  const [text, setText] = useState(editingEntry?.text || '')
  const [mood, setMood] = useState<MoodValue | ''>(editingEntry?.mood || '')
  const [weather, setWeather] = useState<WeatherValue | ''>(editingEntry?.weather || '')
  const [temperature, setTemperature] = useState(editingEntry?.temperature || '')
  const [imageBase64, setImageBase64] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(!editingEntry)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'failed'>(editingEntry ? 'success' : 'loading')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!editingEntry

  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-fetch weather on mount
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true)
      try {
        // Try to get location from browser
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 300000, // 5 min cache
          })
        })

        const { latitude, longitude } = position.coords

        // Open-Meteo API — completely free, no API key needed
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        )
        const data = await res.json()

        if (data.current_weather) {
          const { temperature: temp, weathercode } = data.current_weather
          setTemperature(Math.round(temp).toString())
          setWeather(weatherCodeToValue(weathercode))
          setLocationStatus('success')
        }
      } catch {
        // Location failed — try IP-based fallback
        try {
          const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current_weather=true')
          const data = await res.json()
          if (data.current_weather) {
            const { temperature: temp, weathercode } = data.current_weather
            setTemperature(Math.round(temp).toString())
            setWeather(weatherCodeToValue(weathercode))
          }
        } catch {
          // Final fallback — leave empty, user can manually select
        }
        setLocationStatus('failed')
      }
      setWeatherLoading(false)
    }

    fetchWeather()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let w = img.width
        let h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = (h * MAX) / w
            w = MAX
          } else {
            w = (w * MAX) / h
            h = MAX
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.7)
        setImageBase64(compressed)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const content = JSON.stringify({
        text: text.trim(),
        mood,
        weather,
        temperature,
        recordedAt: new Date().toISOString(),
      })
      const encryptedContent = await encrypt(content, cryptoKey)
      let encryptedImage: string | null = null
      if (imageBase64) {
        encryptedImage = await encrypt(imageBase64, cryptoKey)
      }

      if (isEditing && editingEntry) {
        // Update existing entry
        const res = await fetch(`/api/diary/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encryptedContent, encryptedImage }),
        })
        if (res.ok) {
          // Pet gains exp when editing diary
          fetch('/api/pet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'diary' }),
          }).catch(() => {})
          onSubmitted()
        }
      } else {
        // Create new entry
        const entryDate = new Date().toISOString().slice(0, 10)
        const res = await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            encryptedContent,
            encryptedImage,
            entryDate,
          }),
        })
        if (res.ok) {
          // Pet gains exp when writing diary
          fetch('/api/pet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'diary' }),
          }).catch(() => {})
          onSubmitted()
        }
      }
    } catch (e) {
      console.error('Submit failed:', e)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8F0]/50 dark:bg-[#1A1614]/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8D5DE]/30 dark:border-[#4A3540]/30">
        <button onClick={onCancel} className="text-[#9B8A8E] dark:text-[#A89890] text-sm">
          取消
        </button>
        <h2 className="font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">{isEditing ? '编辑记录' : '新的记录'}</h2>
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl px-4 h-8 text-sm"
        >
          {submitting ? '保存中...' : isEditing ? '保存修改 ✨' : '记录 ✨'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-24">
        {/* Auto Info Bar */}
        <div className="bg-white/60 dark:bg-[#2A1F1E]/60 rounded-2xl p-3 border border-[#E8D5DE]/30 dark:border-[#4A3540]/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Date & Time — auto, precise to seconds */}
            <div className="flex items-center gap-1.5 text-sm text-[#3D2C2E] dark:text-[#F5E6D3]">
              <span>📅</span>
              <span>
                {currentTime.toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[#3D2C2E] dark:text-[#F5E6D3]">
              <span>🕐</span>
              <span className="font-mono tabular-nums">
                {currentTime.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}
              </span>
            </div>

            {/* Weather Auto */}
            <div className="flex items-center gap-1.5 text-sm">
              {weatherLoading ? (
                <span className="flex items-center gap-1 text-[#B8A8AC]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">获取天气...</span>
                </span>
              ) : weather ? (
                <>
                  <span>{WEATHER_LABELS[weather]}</span>
                  {temperature && <span className="text-[#9B8A8E]">{temperature}°C</span>}
                  {locationStatus === 'success' && (
                    <MapPin className="w-3 h-3 text-[#E8A0BF]" />
                  )}
                </>
              ) : (
                <span className="text-xs text-[#B8A8AC]">天气获取失败</span>
              )}
            </div>
          </div>
        </div>

        {/* Text Area */}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="此刻的心情..."
          className="min-h-[160px] bg-white/60 dark:bg-[#2A1F1E]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-2xl text-[#3D2C2E] dark:text-[#F5E6D3] placeholder:text-[#C8B8BC] resize-none text-[15px] leading-relaxed focus:ring-[#E8A0BF]/30"
        />

        {/* Image */}
        {imageBase64 ? (
          <div className="relative rounded-2xl overflow-hidden">
            <img src={imageBase64} alt="预览" className="w-full max-h-60 object-cover rounded-2xl" />
            <button
              onClick={() => setImageBase64('')}
              className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-[#E8D5DE] dark:border-[#4A3540] text-[#B8A8AC] dark:text-[#6A5A5E] hover:border-[#E8A0BF] transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span className="text-sm">添加图片</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Mood */}
        <div>
          <label className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3] mb-2 block">
            心情
          </label>
          <MoodSelector value={mood} onChange={setMood} />
        </div>

        {/* Weather (auto-filled, but can override) */}
        <div>
          <label className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3] mb-2 block">
            天气 <span className="text-xs text-[#B8A8AC] font-normal">（已自动获取，可修改）</span>
          </label>
          <WeatherSelector value={weather} onChange={setWeather} />
        </div>

        {/* Temperature (auto-filled, but can override) */}
        <div>
          <label className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3] mb-2 block">
            温度 <span className="text-xs text-[#B8A8AC] font-normal">（已自动获取，可修改）</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">
              {temperature || '—'}
            </span>
            <span className="text-[#9B8A8E] dark:text-[#A89890]">°C</span>
            {temperature && (
              <button
                onClick={() => setTemperature('')}
                className="text-xs text-[#B8A8AC] ml-2 hover:text-[#E8A0BF]"
              >
                修改
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
