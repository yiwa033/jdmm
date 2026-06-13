'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Trash2, Heart } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// Pixel art pet SVGs for each type and mood
const PIXEL_PETS: Record<string, Record<string, string>> = {
  cat: {
    happy: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="4" y="1" width="2" height="2" fill="#F5A623"/>
        <rect x="10" y="1" width="2" height="2" fill="#F5A623"/>
        <rect x="3" y="2" width="2" height="2" fill="#F5A623"/>
        <rect x="11" y="2" width="2" height="2" fill="#F5A623"/>
        <rect x="4" y="3" width="8" height="1" fill="#F5A623"/>
        <rect x="3" y="4" width="10" height="5" fill="#F5A623"/>
        <rect x="4" y="5" width="2" height="2" fill="#333"/>
        <rect x="10" y="5" width="2" height="2" fill="#333"/>
        <rect x="7" y="6" width="2" height="1" fill="#E8888A"/>
        <rect x="5" y="8" width="6" height="1" fill="#E8888A"/>
        <rect x="2" y="5" width="2" height="3" fill="#F5A623"/>
        <rect x="12" y="5" width="2" height="3" fill="#F5A623"/>
        <rect x="4" y="9" width="8" height="4" fill="#F5A623"/>
        <rect x="3" y="10" width="2" height="4" fill="#F5A623"/>
        <rect x="11" y="10" width="2" height="4" fill="#F5A623"/>
        <rect x="5" y="10" width="1" height="1" fill="#E8888A"/>
        <rect x="10" y="10" width="1" height="1" fill="#E8888A"/>
      </svg>`,
    normal: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="4" y="1" width="2" height="2" fill="#F5A623"/>
        <rect x="10" y="1" width="2" height="2" fill="#F5A623"/>
        <rect x="3" y="2" width="2" height="2" fill="#F5A623"/>
        <rect x="11" y="2" width="2" height="2" fill="#F5A623"/>
        <rect x="4" y="3" width="8" height="1" fill="#F5A623"/>
        <rect x="3" y="4" width="10" height="5" fill="#F5A623"/>
        <rect x="4" y="5" width="2" height="1" fill="#333"/>
        <rect x="10" y="5" width="2" height="1" fill="#333"/>
        <rect x="7" y="6" width="2" height="1" fill="#E8888A"/>
        <rect x="5" y="8" width="6" height="1" fill="#E8888A"/>
        <rect x="2" y="5" width="2" height="3" fill="#F5A623"/>
        <rect x="12" y="5" width="2" height="3" fill="#F5A623"/>
        <rect x="4" y="9" width="8" height="4" fill="#F5A623"/>
        <rect x="3" y="10" width="2" height="4" fill="#F5A623"/>
        <rect x="11" y="10" width="2" height="4" fill="#F5A623"/>
      </svg>`,
    sad: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="4" y="1" width="2" height="2" fill="#F5A623"/>
        <rect x="10" y="1" width="2" height="2" fill="#F5A623"/>
        <rect x="3" y="2" width="2" height="2" fill="#F5A623"/>
        <rect x="11" y="2" width="2" height="2" fill="#F5A623"/>
        <rect x="4" y="3" width="8" height="1" fill="#F5A623"/>
        <rect x="3" y="4" width="10" height="5" fill="#F5A623"/>
        <rect x="4" y="5" width="2" height="1" fill="#333"/>
        <rect x="10" y="5" width="2" height="1" fill="#333"/>
        <rect x="5" y="4" width="1" height="1" fill="#6CF"/>
        <rect x="11" y="4" width="1" height="1" fill="#6CF"/>
        <rect x="7" y="7" width="2" height="1" fill="#E8888A"/>
        <rect x="5" y="8" width="6" height="1" fill="#E8888A"/>
        <rect x="2" y="5" width="2" height="3" fill="#F5A623"/>
        <rect x="12" y="5" width="2" height="3" fill="#F5A623"/>
        <rect x="4" y="9" width="8" height="4" fill="#F5A623"/>
        <rect x="3" y="10" width="2" height="4" fill="#F5A623"/>
        <rect x="11" y="10" width="2" height="4" fill="#F5A623"/>
      </svg>`,
  },
  dog: {
    happy: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="2" y="2" width="3" height="3" fill="#C8956C"/>
        <rect x="11" y="2" width="3" height="3" fill="#C8956C"/>
        <rect x="4" y="3" width="8" height="1" fill="#D4A574"/>
        <rect x="3" y="4" width="10" height="5" fill="#D4A574"/>
        <rect x="4" y="5" width="2" height="2" fill="#333"/>
        <rect x="10" y="5" width="2" height="2" fill="#333"/>
        <rect x="6" y="5" width="1" height="1" fill="#FFF"/>
        <rect x="9" y="5" width="1" height="1" fill="#FFF"/>
        <rect x="7" y="6" width="2" height="1" fill="#333"/>
        <rect x="6" y="7" width="4" height="2" fill="#E8A088"/>
        <rect x="7" y="8" width="2" height="1" fill="#F5C6AA"/>
        <rect x="4" y="9" width="8" height="4" fill="#D4A574"/>
        <rect x="3" y="10" width="2" height="4" fill="#D4A574"/>
        <rect x="11" y="10" width="2" height="4" fill="#D4A574"/>
        <rect x="7" y="12" width="2" height="1" fill="#E8A088"/>
      </svg>`,
    normal: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="2" y="2" width="3" height="3" fill="#C8956C"/>
        <rect x="11" y="2" width="3" height="3" fill="#C8956C"/>
        <rect x="4" y="3" width="8" height="1" fill="#D4A574"/>
        <rect x="3" y="4" width="10" height="5" fill="#D4A574"/>
        <rect x="4" y="5" width="2" height="1" fill="#333"/>
        <rect x="10" y="5" width="2" height="1" fill="#333"/>
        <rect x="7" y="6" width="2" height="1" fill="#333"/>
        <rect x="6" y="7" width="4" height="2" fill="#E8A088"/>
        <rect x="4" y="9" width="8" height="4" fill="#D4A574"/>
        <rect x="3" y="10" width="2" height="4" fill="#D4A574"/>
        <rect x="11" y="10" width="2" height="4" fill="#D4A574"/>
      </svg>`,
    sad: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="2" y="2" width="3" height="3" fill="#C8956C"/>
        <rect x="11" y="2" width="3" height="3" fill="#C8956C"/>
        <rect x="4" y="3" width="8" height="1" fill="#D4A574"/>
        <rect x="3" y="4" width="10" height="5" fill="#D4A574"/>
        <rect x="4" y="5" width="2" height="1" fill="#333"/>
        <rect x="10" y="5" width="2" height="1" fill="#333"/>
        <rect x="7" y="7" width="2" height="1" fill="#333"/>
        <rect x="6" y="8" width="4" height="1" fill="#E8A088"/>
        <rect x="4" y="9" width="8" height="4" fill="#D4A574"/>
        <rect x="3" y="10" width="2" height="4" fill="#D4A574"/>
        <rect x="11" y="10" width="2" height="4" fill="#D4A574"/>
      </svg>`,
  },
  rabbit: {
    happy: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="5" y="0" width="2" height="4" fill="#F0E0E8"/>
        <rect x="9" y="0" width="2" height="4" fill="#F0E0E8"/>
        <rect x="6" y="1" width="1" height="2" fill="#F5B0C0"/>
        <rect x="10" y="1" width="1" height="2" fill="#F5B0C0"/>
        <rect x="4" y="4" width="8" height="1" fill="#F0E0E8"/>
        <rect x="3" y="5" width="10" height="5" fill="#F0E0E8"/>
        <rect x="5" y="6" width="2" height="1" fill="#E06080"/>
        <rect x="9" y="6" width="2" height="1" fill="#E06080"/>
        <rect x="7" y="7" width="2" height="1" fill="#F5B0C0"/>
        <rect x="5" y="8" width="2" height="1" fill="#F5B0C0"/>
        <rect x="9" y="8" width="2" height="1" fill="#F5B0C0"/>
        <rect x="4" y="10" width="8" height="4" fill="#F0E0E8"/>
        <rect x="3" y="11" width="2" height="3" fill="#F0E0E8"/>
        <rect x="11" y="11" width="2" height="3" fill="#F0E0E8"/>
        <rect x="5" y="11" width="1" height="1" fill="#F5B0C0"/>
        <rect x="10" y="11" width="1" height="1" fill="#F5B0C0"/>
      </svg>`,
    normal: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="5" y="0" width="2" height="4" fill="#F0E0E8"/>
        <rect x="9" y="0" width="2" height="4" fill="#F0E0E8"/>
        <rect x="6" y="1" width="1" height="2" fill="#F5B0C0"/>
        <rect x="10" y="1" width="1" height="2" fill="#F5B0C0"/>
        <rect x="4" y="4" width="8" height="1" fill="#F0E0E8"/>
        <rect x="3" y="5" width="10" height="5" fill="#F0E0E8"/>
        <rect x="5" y="6" width="2" height="1" fill="#E06080"/>
        <rect x="9" y="6" width="2" height="1" fill="#E06080"/>
        <rect x="7" y="7" width="2" height="1" fill="#F5B0C0"/>
        <rect x="4" y="10" width="8" height="4" fill="#F0E0E8"/>
        <rect x="3" y="11" width="2" height="3" fill="#F0E0E8"/>
        <rect x="11" y="11" width="2" height="3" fill="#F0E0E8"/>
      </svg>`,
    sad: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="5" y="0" width="2" height="4" fill="#F0E0E8"/>
        <rect x="9" y="0" width="2" height="4" fill="#F0E0E8"/>
        <rect x="6" y="1" width="1" height="2" fill="#F5B0C0"/>
        <rect x="10" y="1" width="1" height="2" fill="#F5B0C0"/>
        <rect x="4" y="4" width="8" height="1" fill="#F0E0E8"/>
        <rect x="3" y="5" width="10" height="5" fill="#F0E0E8"/>
        <rect x="5" y="6" width="2" height="1" fill="#E06080"/>
        <rect x="9" y="6" width="2" height="1" fill="#E06080"/>
        <rect x="7" y="8" width="2" height="1" fill="#F5B0C0"/>
        <rect x="6" y="5" width="1" height="1" fill="#6CF"/>
        <rect x="4" y="10" width="8" height="4" fill="#F0E0E8"/>
        <rect x="3" y="11" width="2" height="3" fill="#F0E0E8"/>
        <rect x="11" y="11" width="2" height="3" fill="#F0E0E8"/>
      </svg>`,
  },
  hamster: {
    happy: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="4" y="3" width="3" height="2" fill="#F5D6A0"/>
        <rect x="9" y="3" width="3" height="2" fill="#F5D6A0"/>
        <rect x="5" y="4" width="1" height="1" fill="#F5B0C0"/>
        <rect x="10" y="4" width="1" height="1" fill="#F5B0C0"/>
        <rect x="4" y="5" width="8" height="1" fill="#F5D6A0"/>
        <rect x="3" y="6" width="10" height="5" fill="#F5D6A0"/>
        <rect x="5" y="7" width="2" height="1" fill="#333"/>
        <rect x="9" y="7" width="2" height="1" fill="#333"/>
        <rect x="7" y="8" width="2" height="1" fill="#F5B0C0"/>
        <rect x="4" y="9" width="3" height="2" fill="#FFF0D0"/>
        <rect x="9" y="9" width="3" height="2" fill="#FFF0D0"/>
        <rect x="4" y="11" width="8" height="3" fill="#F5D6A0"/>
        <rect x="3" y="12" width="2" height="2" fill="#F5D6A0"/>
        <rect x="11" y="12" width="2" height="2" fill="#F5D6A0"/>
      </svg>`,
    normal: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="4" y="3" width="3" height="2" fill="#F5D6A0"/>
        <rect x="9" y="3" width="3" height="2" fill="#F5D6A0"/>
        <rect x="5" y="4" width="1" height="1" fill="#F5B0C0"/>
        <rect x="10" y="4" width="1" height="1" fill="#F5B0C0"/>
        <rect x="4" y="5" width="8" height="1" fill="#F5D6A0"/>
        <rect x="3" y="6" width="10" height="5" fill="#F5D6A0"/>
        <rect x="5" y="7" width="2" height="1" fill="#333"/>
        <rect x="9" y="7" width="2" height="1" fill="#333"/>
        <rect x="7" y="8" width="2" height="1" fill="#F5B0C0"/>
        <rect x="4" y="9" width="3" height="2" fill="#FFF0D0"/>
        <rect x="9" y="9" width="3" height="2" fill="#FFF0D0"/>
        <rect x="4" y="11" width="8" height="3" fill="#F5D6A0"/>
        <rect x="3" y="12" width="2" height="2" fill="#F5D6A0"/>
        <rect x="11" y="12" width="2" height="2" fill="#F5D6A0"/>
      </svg>`,
    sad: `
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <rect x="4" y="3" width="3" height="2" fill="#F5D6A0"/>
        <rect x="9" y="3" width="3" height="2" fill="#F5D6A0"/>
        <rect x="5" y="4" width="1" height="1" fill="#F5B0C0"/>
        <rect x="10" y="4" width="1" height="1" fill="#F5B0C0"/>
        <rect x="4" y="5" width="8" height="1" fill="#F5D6A0"/>
        <rect x="3" y="6" width="10" height="5" fill="#F5D6A0"/>
        <rect x="5" y="7" width="2" height="1" fill="#333"/>
        <rect x="9" y="7" width="2" height="1" fill="#333"/>
        <rect x="7" y="9" width="2" height="1" fill="#F5B0C0"/>
        <rect x="4" y="9" width="3" height="2" fill="#FFF0D0"/>
        <rect x="9" y="9" width="3" height="2" fill="#FFF0D0"/>
        <rect x="4" y="11" width="8" height="3" fill="#F5D6A0"/>
        <rect x="3" y="12" width="2" height="2" fill="#F5D6A0"/>
        <rect x="11" y="12" width="2" height="2" fill="#F5D6A0"/>
      </svg>`,
  },
}

// Pixel art decorative elements
const PIXEL_HEARTS = [
  `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect x="1" y="1" width="2" height="2" fill="#E8A0BF"/><rect x="5" y="1" width="2" height="2" fill="#E8A0BF"/><rect x="0" y="2" width="8" height="2" fill="#E8A0BF"/><rect x="1" y="4" width="6" height="2" fill="#E8A0BF"/><rect x="2" y="6" width="4" height="1" fill="#E8A0BF"/><rect x="3" y="7" width="2" height="1" fill="#E8A0BF"/></svg>`,
  `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect x="1" y="1" width="2" height="2" fill="#F2C57C"/><rect x="5" y="1" width="2" height="2" fill="#F2C57C"/><rect x="0" y="2" width="8" height="2" fill="#F2C57C"/><rect x="1" y="4" width="6" height="2" fill="#F2C57C"/><rect x="2" y="6" width="4" height="1" fill="#F2C57C"/><rect x="3" y="7" width="2" height="1" fill="#F2C57C"/></svg>`,
]

const PIXEL_SPARKLE = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect x="3" y="0" width="2" height="2" fill="#FFD54F"/><rect x="0" y="3" width="2" height="2" fill="#FFD54F"/><rect x="3" y="3" width="2" height="2" fill="#FFD54F"/><rect x="6" y="3" width="2" height="2" fill="#FFD54F"/><rect x="3" y="6" width="2" height="2" fill="#FFD54F"/></svg>`

const MOOD_SUGGESTIONS: Record<string, string[]> = {
  '😢': ['我心情不太好…', '今天有点难过', '感觉很失落'],
  '😤': ['我好生气', '太烦了', '有些事情让我很不爽'],
  '😰': ['我很焦虑', '好担心', '压力好大'],
  '😔': ['感觉很迷茫', '提不起精神', '有点丧'],
  '🥺': ['有点委屈', '感觉没人理解我', '好孤单'],
  '😴': ['好累啊', '想休息了', '身心俱疲'],
  default: ['今天过得怎么样', '聊聊心事吧', '我需要有人陪'],
}

function getPixelPet(petType: string, mood: 'happy' | 'normal' | 'sad'): string {
  const pets = PIXEL_PETS[petType] || PIXEL_PETS.cat
  return pets[mood] || pets.normal
}

function getMoodFromMessages(messages: ChatMessage[]): 'happy' | 'normal' | 'sad' {
  if (messages.length === 0) return 'normal'
  const lastMsg = messages[messages.length - 1].content
  const sadKeywords = ['难过', '伤心', '烦', '累', '焦虑', '生气', '委屈', '迷茫', '孤独', '不开心', '丧', '压力', '担心']
  const happyKeywords = ['开心', '快乐', '高兴', '幸福', '好的', '谢谢', '好多了', '嗯嗯', '哈哈']
  if (sadKeywords.some(k => lastMsg.includes(k))) return 'sad'
  if (happyKeywords.some(k => lastMsg.includes(k))) return 'happy'
  return 'normal'
}

interface AICompanionProps {
  currentMood?: string
}

export default function AICompanion({ currentMood }: AICompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [petType, setPetType] = useState<string>('cat')
  const [showWelcome, setShowWelcome] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load pet type from pet API
  useEffect(() => {
    fetch('/api/pet')
      .then(res => res.json())
      .then(data => {
        if (data.petType) setPetType(data.petType)
      })
      .catch(() => {})
  }, [])

  const petMood = getMoodFromMessages(messages)
  const pixelPetSvg = getPixelPet(petType, petMood)

  const suggestions = currentMood && MOOD_SUGGESTIONS[currentMood]
    ? MOOD_SUGGESTIONS[currentMood]
    : MOOD_SUGGESTIONS.default

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setShowWelcome(false)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          mood: currentMood,
        }),
      })
      const data = await res.json()

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: '呜…信号不太好，能再说一次吗？💭',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errMsg])
    }
    setIsLoading(false)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    setMessages([])
    setShowWelcome(true)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with pixel pet */}
      <div className="bg-gradient-to-b from-[#FFF0F5] to-[#FFF8F0] dark:from-[#3A2028] dark:to-[#2A1F1E] rounded-3xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 mx-1 mb-2 relative overflow-hidden">
        {/* Decorative pixel elements */}
        <div className="absolute top-2 right-3 w-4 h-4 opacity-40 animate-pet-idle"
          dangerouslySetInnerHTML={{ __html: PIXEL_HEARTS[0] }}
        />
        <div className="absolute top-6 right-10 w-3 h-3 opacity-30 animate-pet-idle" style={{ animationDelay: '0.5s' }}
          dangerouslySetInnerHTML={{ __html: PIXEL_SPARKLE }}
        />
        <div className="absolute bottom-2 left-4 w-3 h-3 opacity-30 animate-pet-idle" style={{ animationDelay: '1s' }}
          dangerouslySetInnerHTML={{ __html: PIXEL_HEARTS[1] }}
        />

        <div className="flex items-center gap-4">
          {/* Pixel pet avatar */}
          <div className={`w-16 h-16 flex-shrink-0 transition-transform duration-300 ${
            isLoading ? 'animate-pet-idle' : petMood === 'happy' ? 'animate-bounce' : ''
          }`}
            style={{ imageRendering: 'pixelated' }}
            dangerouslySetInnerHTML={{ __html: pixelPetSvg }}
          />

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#3D2C2E] dark:text-[#F5E6D3]">心灵伙伴</h2>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <p className="text-xs text-[#9B8A8E] dark:text-[#A89890] mt-0.5">
              {petMood === 'sad' ? '我在听，慢慢说…' : petMood === 'happy' ? '和你聊天真开心~' : '随时陪着你 💕'}
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-xl bg-white/50 dark:bg-[#1A1614]/50 border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-[#9B8A8E] hover:text-[#E8A0BF] transition-colors"
              title="清空对话"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3">
        {showWelcome && messages.length === 0 && (
          <div className="flex flex-col items-center py-6 animate-scale-in">
            <div className="w-24 h-24 mb-3 transition-transform hover:scale-110"
              style={{ imageRendering: 'pixelated' }}
              dangerouslySetInnerHTML={{ __html: pixelPetSvg }}
            />
            <p className="text-sm text-[#9B8A8E] dark:text-[#A89890] text-center mb-4">
              嗨，我是你的心灵伙伴~<br />有什么想聊的，我都在这里陪你 💕
            </p>

            {/* Mood-based quick suggestions */}
            <div className="space-y-2 w-full max-w-xs">
              {suggestions.map((text, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(text)}
                  className="w-full text-left px-4 py-2.5 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-sm text-[#3D2C2E] dark:text-[#F5E6D3] hover:bg-[#FFF0F5] dark:hover:bg-[#3A2028] transition-colors active:scale-[0.98]"
                >
                  <span className="mr-2 text-[#E8A0BF]">💬</span>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 mr-2 mt-1 rounded-lg overflow-hidden bg-[#FFF0F5] dark:bg-[#3A2028] border border-[#E8D5DE]/30 dark:border-[#4A3540]/30"
                style={{ imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: pixelPetSvg }}
              />
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-br-md'
                  : 'bg-white/80 dark:bg-[#2A1F1E]/80 border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-[#3D2C2E] dark:text-[#F5E6D3] rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-scale-in">
            <div className="flex-shrink-0 w-8 h-8 mr-2 mt-1 rounded-lg overflow-hidden bg-[#FFF0F5] dark:bg-[#3A2028] border border-[#E8D5DE]/30 dark:border-[#4A3540]/30"
              style={{ imageRendering: 'pixelated' }}
              dangerouslySetInnerHTML={{ __html: pixelPetSvg }}
            />
            <div className="bg-white/80 dark:bg-[#2A1F1E]/80 border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[#E8A0BF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[#E8A0BF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[#E8A0BF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="px-2 pt-2 pb-2">
        {/* Quick mood chips */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
          {['💕 想聊聊', '😔 不开心', '😰 好焦虑', '😤 有点气', '😴 好累', '🌈 开心'].map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip.slice(2).trim())}
              disabled={isLoading}
              className="flex-shrink-0 px-3 py-1.5 bg-white/60 dark:bg-[#2A1F1E]/60 rounded-full border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-xs text-[#9B8A8E] dark:text-[#A89890] hover:bg-[#FFF0F5] dark:hover:bg-[#3A2028] hover:text-[#E8A0BF] transition-colors disabled:opacity-50 active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="说点什么…我听着呢"
            disabled={isLoading}
            className="flex-1 bg-white/70 dark:bg-[#2A1F1E]/70 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-2xl h-11 text-sm"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 p-0 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] rounded-2xl hover:shadow-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  )
}
