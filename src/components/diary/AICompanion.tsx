'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Trash2, Wind, BookOpen, X, ShieldAlert } from 'lucide-react'
import { getPixelPet } from './PixelPet'
import { hasSensitiveContent } from '@/lib/contentFilter'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
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

const CHAT_STORAGE_KEY = 'diary-chat-history'

function getMoodFromMessages(messages: ChatMessage[]): 'happy' | 'normal' | 'sad' {
  if (messages.length === 0) return 'normal'
  const lastMsg = messages[messages.length - 1].content
  const sadKeywords = ['难过', '伤心', '烦', '累', '焦虑', '生气', '委屈', '迷茫', '孤独', '不开心', '丧', '压力', '担心', '害怕', '慌']
  const happyKeywords = ['开心', '快乐', '高兴', '幸福', '好的', '谢谢', '好多了', '嗯嗯', '哈哈', '好了', '没事']
  if (sadKeywords.some(k => lastMsg.includes(k))) return 'sad'
  if (happyKeywords.some(k => lastMsg.includes(k))) return 'happy'
  return 'normal'
}

// Simple markdown-like rendering for AI messages
function renderAIContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/🫁/g, '<span class="text-lg">🫁</span>')
    .replace(/\n/g, '<br/>')
}

interface AICompanionProps {
  currentMood?: string
  diaryContext?: string
}

export default function AICompanion({ currentMood, diaryContext }: AICompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [petType, setPetType] = useState<string>('cat')
  const [showWelcome, setShowWelcome] = useState(true)
  const [showBreathing, setShowBreathing] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'done'>('inhale')
  const [breathCount, setBreathCount] = useState(0)
  const [showMoodPrompt, setShowMoodPrompt] = useState(false)
  const [contentWarning, setContentWarning] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          setShowWelcome(false)
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const toSave = messages.slice(-50)
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave))
      } catch { /* ignore */ }
    }
  }, [messages])

  // Show mood prompt when mood changes to a negative one
  useEffect(() => {
    if (currentMood && ['😢', '😤', '😰', '😔', '🥺', '😴'].includes(currentMood)) {
      const timer = setTimeout(() => setShowMoodPrompt(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [currentMood])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Load pet type from pet API
  useEffect(() => {
    fetch('/api/pet')
      .then(res => res.json())
      .then(data => {
        if (data.petType) setPetType(data.petType)
      })
      .catch(() => {})
  }, [])

  // Breathing exercise timer
  useEffect(() => {
    if (!showBreathing || breathPhase === 'done') return

    const timers: Record<string, number> = {
      inhale: 4000,
      hold: 4000,
      exhale: 6000,
    }

    const timer = setTimeout(() => {
      if (breathPhase === 'inhale') {
        setBreathPhase('hold')
      } else if (breathPhase === 'hold') {
        setBreathPhase('exhale')
      } else if (breathPhase === 'exhale') {
        const next = breathCount + 1
        if (next >= 3) {
          setBreathPhase('done')
          setBreathCount(0)
        } else {
          setBreathCount(next)
          setBreathPhase('inhale')
        }
      }
    }, timers[breathPhase])

    return () => clearTimeout(timer)
  }, [showBreathing, breathPhase, breathCount])

  const petMood = getMoodFromMessages(messages)
  const pixelPetSvg = getPixelPet(petType, petMood)

  const suggestions = currentMood && MOOD_SUGGESTIONS[currentMood]
    ? MOOD_SUGGESTIONS[currentMood]
    : MOOD_SUGGESTIONS.default

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    // === 前端敏感内容检测 ===
    if (hasSensitiveContent(text.trim())) {
      setContentWarning('检测到敏感内容，请修改后重新发送。我们聊聊其他话题吧~🛡️')
      setTimeout(() => setContentWarning(''), 4000)
      return
    }

    setContentWarning('')
    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setShowWelcome(false)
    setShowMoodPrompt(false)

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
          diaryContext: diaryContext || '',
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
  }, [messages, isLoading, currentMood, diaryContext])

  const clearChat = () => {
    setMessages([])
    setShowWelcome(true)
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY)
    } catch { /* ignore */ }
  }

  const startBreathing = () => {
    setShowBreathing(true)
    setBreathPhase('inhale')
    setBreathCount(0)
  }

  const stopBreathing = () => {
    setShowBreathing(false)
    setBreathPhase('done')
    setBreathCount(0)
    sendMessage('我做完呼吸练习了')
  }

  const breathLabel = {
    inhale: '吸气…',
    hold: '屏住…',
    exhale: '呼气…',
    done: '完成！',
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
              <span className="text-[10px] px-1.5 py-0.5 bg-[#E8F5E9] dark:bg-[#1A2A1A] rounded-full text-[#4CAF50] dark:text-[#81C784]">免费</span>
            </div>
            <p className="text-xs text-[#9B8A8E] dark:text-[#A89890] mt-0.5">
              {petMood === 'sad' ? '我在听，慢慢说…' : petMood === 'happy' ? '和你聊天真开心~' : '随时陪着你 💕'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Breathing exercise button */}
            <button
              onClick={startBreathing}
              className="p-2 rounded-xl bg-white/50 dark:bg-[#1A1614]/50 border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-[#9B8A8E] hover:text-[#A5D6A7] transition-colors"
              title="呼吸练习"
            >
              <Wind className="w-4 h-4" />
            </button>
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
      </div>

      {/* Breathing Exercise Overlay */}
      {showBreathing && (
        <div className="mx-1 mb-2 bg-gradient-to-b from-[#E8F5E9] to-[#F1F8E9] dark:from-[#1A2A1A] dark:to-[#1A2518] rounded-3xl p-6 border border-[#A5D6A7]/40 dark:border-[#2A5A2A]/40 animate-scale-in">
          <div className="flex flex-col items-center">
            <div className="text-sm text-[#4CAF50] dark:text-[#81C784] mb-3 font-medium">呼吸练习 · 第 {breathCount + 1}/3 轮</div>
            <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${
              breathPhase === 'inhale' ? 'scale-125 bg-[#A5D6A7]/30 dark:bg-[#4CAF50]/20' :
              breathPhase === 'hold' ? 'scale-125 bg-[#FFD54F]/30 dark:bg-[#FFA726]/20' :
              breathPhase === 'exhale' ? 'scale-100 bg-[#E8A0BF]/20 dark:bg-[#E8A0BF]/10' :
              'scale-100 bg-[#A5D6A7]/20'
            }`}>
              <span className={`text-2xl font-bold ${
                breathPhase === 'done' ? 'text-[#4CAF50]' : 'text-[#3D2C2E] dark:text-[#F5E6D3]'
              }`}>
                {breathPhase === 'done' ? '🎉' : breathLabel[breathPhase]}
              </span>
            </div>
            <div className="mt-3 text-xs text-[#9B8A8E] dark:text-[#A89890] text-center">
              {breathPhase === 'inhale' ? '慢慢吸气 4 秒…' :
               breathPhase === 'hold' ? '屏住呼吸 4 秒…' :
               breathPhase === 'exhale' ? '缓缓呼气 6 秒…' :
               '太棒了！呼吸练习完成 🌟'}
            </div>
            <Button
              onClick={breathPhase === 'done' ? stopBreathing : () => setShowBreathing(false)}
              className={`mt-3 rounded-2xl text-sm ${
                breathPhase === 'done'
                  ? 'bg-gradient-to-r from-[#A5D6A7] to-[#81C784] text-white'
                  : 'bg-white/60 dark:bg-[#2A1F1E]/60 text-[#9B8A8E]'
              }`}
              variant="ghost"
            >
              {breathPhase === 'done' ? '完成' : '跳过'}
            </Button>
          </div>
        </div>
      )}

      {/* Mood Care Prompt - shown when user just wrote a negative diary */}
      {showMoodPrompt && !showBreathing && (
        <div className="mx-1 mb-2 bg-gradient-to-b from-[#FFF0F5] to-[#FDE8EF] dark:from-[#3A2028] dark:to-[#2A1520] rounded-2xl p-4 border border-[#E8A0BF]/40 dark:border-[#6A3040]/40 animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-[#FFF0F5] dark:bg-[#3A2028] border border-[#E8D5DE]/30 dark:border-[#4A3540]/30"
              style={{ imageRendering: 'pixelated' }}
              dangerouslySetInnerHTML={{ __html: pixelPetSvg }}
            />
            <div className="flex-1">
              <p className="text-sm text-[#3D2C2E] dark:text-[#F5E6D3] mb-2">
                我感觉你写日记时心情不太好…要不要跟我聊聊？💕
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setShowMoodPrompt(false); sendMessage('写完日记心情不太好，想聊聊') }}
                  className="px-3 py-1.5 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-full border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-xs text-[#E8A0BF] hover:bg-[#FFF0F5] dark:hover:bg-[#3A2028] transition-colors"
                >
                  💬 想聊聊
                </button>
                <button
                  onClick={() => { setShowMoodPrompt(false); startBreathing() }}
                  className="px-3 py-1.5 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-full border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-xs text-[#A5D6A7] hover:bg-[#F0FFF0] dark:hover:bg-[#1A2A1A] transition-colors"
                >
                  🫁 呼吸练习
                </button>
                <button
                  onClick={() => setShowMoodPrompt(false)}
                  className="px-3 py-1.5 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-full border border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-xs text-[#9B8A8E] hover:bg-white dark:hover:bg-[#2A1F1E] transition-colors"
                >
                  暂时不用
                </button>
              </div>
            </div>
            <button onClick={() => setShowMoodPrompt(false)} className="text-[#9B8A8E] hover:text-[#3D2C2E] dark:hover:text-[#F5E6D3]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3">
        {showWelcome && messages.length === 0 && (
          <div className="flex flex-col items-center py-4 animate-scale-in">
            <div className="w-24 h-24 mb-3 transition-transform hover:scale-110"
              style={{ imageRendering: 'pixelated' }}
              dangerouslySetInnerHTML={{ __html: pixelPetSvg }}
            />
            <p className="text-sm text-[#9B8A8E] dark:text-[#A89890] text-center mb-3">
              嗨，我是你的心灵伙伴~<br />有什么想聊的，我都在这里陪你 💕
            </p>
            <p className="text-[10px] text-[#B8A8AC] dark:text-[#6A5A5E] mb-4">✨ 完全免费 · 隐私安全 · 随时陪伴</p>

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

            {/* Quick actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={startBreathing}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#E8F5E9]/60 dark:bg-[#1A2A1A]/60 rounded-2xl border border-[#A5D6A7]/30 dark:border-[#2A5A2A]/30 text-xs text-[#4CAF50] dark:text-[#81C784] hover:bg-[#E8F5E9] dark:hover:bg-[#1A2A1A] transition-colors"
              >
                <Wind className="w-3.5 h-3.5" /> 呼吸练习
              </button>
              <button
                onClick={() => sendMessage('分享一下今天的小确幸吧')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FFF8F0]/60 dark:bg-[#3A3020]/60 rounded-2xl border border-[#F2C57C]/30 dark:border-[#6A5020]/30 text-xs text-[#F2C57C] dark:text-[#FFD54F] hover:bg-[#FFF8F0] dark:hover:bg-[#3A3020] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> 日常闲聊
              </button>
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
              {msg.role === 'assistant' ? (
                <span dangerouslySetInnerHTML={{ __html: renderAIContent(msg.content) }} />
              ) : (
                msg.content
              )}
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

      {/* Content safety warning */}
      {contentWarning && (
        <div className="mx-2 mb-1 flex items-center gap-2 px-3 py-2 bg-[#FFF3E0] dark:bg-[#3A2A1A] rounded-xl border border-[#FFB74D]/40 dark:border-[#6A4A2A]/40 animate-scale-in">
          <ShieldAlert className="w-4 h-4 text-[#FF9800] flex-shrink-0" />
          <span className="text-xs text-[#E65100] dark:text-[#FFB74D]">{contentWarning}</span>
          <button onClick={() => setContentWarning('')} className="ml-auto text-[#FF9800] hover:text-[#E65100]">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-2 pt-2 pb-2">
        {/* Quick mood chips */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { emoji: '💕', text: '想聊聊' },
            { emoji: '😔', text: '不开心' },
            { emoji: '😰', text: '好焦虑' },
            { emoji: '😤', text: '有点气' },
            { emoji: '😴', text: '好累' },
            { emoji: '🌈', text: '开心' },
            { emoji: '🫁', text: '呼吸练习', action: 'breath' },
          ].map((chip) => (
            <button
              key={chip.text}
              onClick={() => chip.action === 'breath' ? startBreathing() : sendMessage(chip.text)}
              disabled={isLoading}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs transition-colors disabled:opacity-50 active:scale-95 ${
                chip.action === 'breath'
                  ? 'bg-[#E8F5E9]/60 dark:bg-[#1A2A1A]/60 border-[#A5D6A7]/30 dark:border-[#2A5A2A]/30 text-[#4CAF50] dark:text-[#81C784] hover:bg-[#E8F5E9] dark:hover:bg-[#1A2A1A]'
                  : 'bg-white/60 dark:bg-[#2A1F1E]/60 border-[#E8D5DE]/30 dark:border-[#4A3540]/30 text-[#9B8A8E] dark:text-[#A89890] hover:bg-[#FFF0F5] dark:hover:bg-[#3A2028] hover:text-[#E8A0BF]'
              }`}
            >
              {chip.emoji} {chip.text}
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
            placeholder="说点什么…我听着呢 💕"
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
