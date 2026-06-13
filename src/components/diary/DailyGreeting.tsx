'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

const GREETINGS: Record<string, string[]> = {
  morning: [
    '早安，新的一天从记录开始 ☀️',
    '清晨的阳光正好，写点什么吧~',
    '每一个早晨都是新的开始 🌅',
    '今天的你，值得被记录 📝',
    '早安，把昨夜的梦写下吧~',
  ],
  afternoon: [
    '午后时光，适合慢慢记录 🌤',
    '忙碌之余，别忘了关心自己~',
    '下午好呀，停下来写写心情吧',
    '阳光正好，记录此刻的温暖~',
    '午后的你，辛苦了 💕',
  ],
  evening: [
    '晚上好，今天过得怎么样？🌙',
    '夜深了，给自己一个倾诉的角落',
    '把今天的故事留下来吧 ✨',
    '辛苦一天了，和自己说说话~',
    '夜晚是整理心情的好时候 🌜',
  ],
}

const DAILY_QUOTES = [
  '生活不会一直温柔，但你可以一直善良。',
  '把心事交给风，把故事留给自己。',
  '慢慢来，比较快。',
  '你配得上这世间所有的好。',
  '记录，是为了更好地前行。',
  '每一段经历都值得被温柔以待。',
  '愿你的每一天，都有值得记录的瞬间。',
  '不必完美，真实就好。',
  '你比想象中更勇敢，比以为的更温柔。',
  '时光不语，却回答了所有问题。',
  '生活总会给你答案，但不会马上告诉你。',
  '愿你眼里有光，心中有爱。',
  '每个平凡的日子，都值得被好好收藏。',
  '好好爱自己，是终身浪漫的开始。',
  '今天也是值得被记住的一天。',
  '所有的美好，都值得等待。',
  '温柔半两，从容一生。',
  '不要因为走得太远，而忘记为什么出发。',
  '你的存在，本身就是一束光。',
  '做一个温暖的人，不卑不亢，清澈善良。',
]

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

function getDailyGreeting(): string {
  const period = getTimeOfDay()
  const greetings = GREETINGS[period]
  // Use date as seed for consistent greeting per day per period
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return greetings[seed % greetings.length]
}

function getDailyQuote(): string {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return DAILY_QUOTES[seed % DAILY_QUOTES.length]
}

function getTimeEmoji(): string {
  const period = getTimeOfDay()
  if (period === 'morning') return '☀️'
  if (period === 'afternoon') return '🌤'
  return '🌙'
}

export default function DailyGreeting() {
  const [greeting] = useState(getDailyGreeting)
  const [quote] = useState(getDailyQuote)
  const [emoji] = useState(getTimeEmoji)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {/* Greeting Card */}
      <div className="bg-gradient-to-r from-[#FFF0F5] to-[#FFF8F0] dark:from-[#3A2028] dark:to-[#2A1F1E] rounded-2xl p-4 border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/60 dark:bg-[#1A1614]/40 flex items-center justify-center text-2xl flex-shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3]">
              {greeting}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3 h-3 text-[#F2C57C] flex-shrink-0" />
              <p className="text-xs text-[#9B8A8E] dark:text-[#A89890] truncate">
                {quote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
