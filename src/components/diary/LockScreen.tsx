'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Lock, Heart, ShieldCheck } from 'lucide-react'
import { deriveKey, hashPin, generateSalt, hexToBytes } from '@/lib/crypto'

interface LockScreenProps {
  onUnlock: (key: CryptoKey) => void
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [isSetup, setIsSetup] = useState<boolean | null>(null)
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const checkRef = useRef(false)

  // Check password exists on mount
  useEffect(() => {
    if (checkRef.current) return
    checkRef.current = true
    const check = async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: '__check__' }),
        })
        const data = await res.json()
        setIsSetup(data.error !== '未设置密码')
      } catch {
        setIsSetup(true)
      }
    }
    check()
  }, [])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handlePinComplete = useCallback(async (currentPin: string) => {
    if (isSetup === null) return

    // Unlock mode
    if (isSetup) {
      if (cooldown > 0) return
      setLoading(true)
      setError('')
      try {
        const hash = await hashPin(currentPin)
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: hash }),
        })
        const data = await res.json()
        if (data.valid && data.salt) {
          const saltBytes = hexToBytes(data.salt)
          const key = await deriveKey(currentPin, saltBytes)
          // Record successful login
          fetch('/api/log/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true }),
          }).catch(() => {})
          onUnlock(key)
        } else {
          const newAttempts = attempts + 1
          setAttempts(newAttempts)
          if (newAttempts >= 3) {
            setCooldown(30)
            setAttempts(0)
            setError('错误次数过多，请30秒后重试')
          } else {
            setError(`密码错误，还有${3 - newAttempts}次机会`)
          }
          setPin('')
          // Record failed login attempt
          fetch('/api/log/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false }),
          }).catch(() => {})
        }
      } catch {
        setError('验证失败，请重试')
        setPin('')
      }
      setLoading(false)
      return
    }

    // Setup mode - first pin
    if (step === 'input') {
      setFirstPin(currentPin)
      setPin('')
      setStep('confirm')
      return
    }

    // Setup mode - confirm pin
    if (currentPin !== firstPin) {
      setError('两次输入不一致，请重新设置')
      setPin('')
      setFirstPin('')
      setStep('input')
      return
    }

    setLoading(true)
    setError('')
    try {
      const salt = generateSalt()
      const hash = await hashPin(currentPin)
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: hash, salt }),
      })
      const data = await res.json()
      if (data.success) {
        const saltBytes = hexToBytes(salt)
        const key = await deriveKey(currentPin, saltBytes)
        // Record first-time setup as a login
        fetch('/api/log/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true }),
        }).catch(() => {})
        onUnlock(key)
      } else {
        setError(data.error || '设置失败')
      }
    } catch {
      setError('设置失败，请重试')
    }
    setLoading(false)
  }, [isSetup, step, firstPin, attempts, cooldown, onUnlock])

  // Handle number press - check pin length directly in handler
  const handleNumPress = (num: number | string) => {
    if (num === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    const newPin = pin + String(num)
    setPin(newPin)
    if (newPin.length === 4 && !loading && cooldown === 0) {
      // Use setTimeout to defer the async call out of the render cycle
      setTimeout(() => handlePinComplete(newPin), 0)
    }
  }

  if (isSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF0F5] to-[#FFF8F0] dark:from-[#1A1614] dark:to-[#2A1F1E]">
        <div className="animate-pulse text-[#E8A0BF]">加载中...</div>
      </div>
    )
  }

  const subtitle = isSetup
    ? '输入密码，打开你的世界'
    : step === 'input'
    ? '设置4位数字密码，守护你的私密空间'
    : '请再次输入密码确认'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#FFF0F5] to-[#FFF8F0] dark:from-[#1A1614] dark:to-[#2A1F1E]">
      <div className="w-full max-w-xs flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E8A0BF] to-[#F2C57C] flex items-center justify-center shadow-lg shadow-[#E8A0BF]/20">
          {isSetup ? (
            <Lock className="w-10 h-10 text-white" />
          ) : (
            <Heart className="w-10 h-10 text-white" />
          )}
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#3D2C2E] dark:text-[#F5E6D3]">
            心语日记
          </h1>
          <p className="text-sm text-[#9B8A8E] dark:text-[#A89890] mt-1">{subtitle}</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin[i]
                  ? 'bg-[#E8A0BF] scale-125'
                  : 'bg-[#E8D5DE] dark:bg-[#4A3540]'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-400 animate-shake">{error}</p>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
            <button
              key={i}
              onClick={() => {
                if (num === null) return
                handleNumPress(num)
              }}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                num === null
                  ? 'invisible'
                  : num === 'del'
                  ? 'bg-[#F5E6D3]/80 dark:bg-[#3A2A20] text-[#9B8A8E] text-base'
                  : 'bg-white/80 dark:bg-[#2A1F1E]/80 text-[#3D2C2E] dark:text-[#F5E6D3] shadow-sm border border-[#E8D5DE]/50 dark:border-[#4A3540]/50 backdrop-blur-sm'
              }`}
            >
              {num === 'del' ? '⌫' : num}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-sm text-[#E8A0BF] animate-pulse">
            {isSetup ? '解锁中...' : '设置中...'}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-[#B8A8AC] dark:text-[#6A5A5E] mt-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AES-256端到端加密 · 你的秘密只属于你</span>
        </div>
      </div>
    </div>
  )
}
