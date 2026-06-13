'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import LockScreen from '@/components/diary/LockScreen'
import MainFeed from '@/components/diary/MainFeed'
import NewEntry from '@/components/diary/NewEntry'
import CalendarView from '@/components/diary/CalendarView'
import Settings from '@/components/diary/Settings'
import BottomNav from '@/components/diary/BottomNav'
import PetCompanion from '@/components/diary/PetCompanion'
import type { MoodValue, WeatherValue } from '@/components/diary/Selectors'

type Tab = 'feed' | 'calendar' | 'new' | 'pet' | 'settings'

const AUTO_LOCK_MS = 30 * 1000 // 30 seconds auto-lock

export default function Home() {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [isDecoy, setIsDecoy] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('feed')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingEntry, setEditingEntry] = useState<{
    id: string
    text: string
    mood: MoodValue | ''
    weather: WeatherValue | ''
    temperature: string
  } | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const handleLock = useCallback(() => {
    setCryptoKey(null)
    setIsDecoy(false)
    setActiveTab('feed')
    setEditingEntry(null)
  }, [])

  // Auto-lock: check inactivity every 5 seconds
  useEffect(() => {
    if (!cryptoKey) return
    const timer = setInterval(() => {
      if (Date.now() - lastActivityRef.current > AUTO_LOCK_MS) {
        handleLock()
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [cryptoKey, handleLock])

  // Track activity: reset timer on any interaction
  useEffect(() => {
    if (!cryptoKey) return
    const resetTimer = () => {
      lastActivityRef.current = Date.now()
    }
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('mousedown', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('scroll', resetTimer, true)
    return () => {
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('mousedown', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('scroll', resetTimer, true)
    }
  }, [cryptoKey])

  const handleUnlock = useCallback((key: CryptoKey, decoy: boolean) => {
    setCryptoKey(key)
    setIsDecoy(decoy)
    lastActivityRef.current = Date.now()
  }, [])

  const handleEntrySubmitted = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
    setActiveTab('feed')
    setEditingEntry(null)
  }, [])

  const handleDeleteEntry = useCallback((_id: string) => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const handleEditEntry = useCallback((entry: {
    id: string
    text: string
    mood: MoodValue | ''
    weather: WeatherValue | ''
    temperature: string
  }) => {
    setEditingEntry(entry)
    setActiveTab('new')
  }, [])

  const handlePinEntry = useCallback((_id: string, _pinned: boolean) => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Show lock screen if not unlocked
  if (!cryptoKey) {
    return <LockScreen onUnlock={handleUnlock} />
  }

  // Decoy mode: show empty diary
  if (isDecoy) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FFF8F0] dark:bg-[#1A1614]">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1A1614]/80 backdrop-blur-lg border-b border-[#E8D5DE]/30 dark:border-[#4A3540]/30">
          <div className="max-w-lg mx-auto flex items-center justify-between h-12 px-4">
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] bg-clip-text text-transparent">
              心语日记
            </h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-24 h-24 rounded-full bg-[#FFF0F5] dark:bg-[#3A2028] flex items-center justify-center">
            <span className="text-4xl">🌙</span>
          </div>
          <p className="text-[#9B8A8E] dark:text-[#A89890] text-center">
            还没有记录哦~<br />
            <span className="text-sm">点击下方按钮，记录此刻的心情</span>
          </p>
        </div>
        <BottomNav active="feed" onChange={() => {}} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] dark:bg-[#1A1614]">
      {/* App Header */}
      {activeTab !== 'new' && (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1A1614]/80 backdrop-blur-lg border-b border-[#E8D5DE]/30 dark:border-[#4A3540]/30">
          <div className="max-w-lg mx-auto flex items-center justify-between h-12 px-4">
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] bg-clip-text text-transparent">
              心语日记
            </h1>
            <span className="text-xs text-[#B8A8AC] dark:text-[#6A5A5E]">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {activeTab === 'feed' && (
          <MainFeed
            cryptoKey={cryptoKey}
            onNewEntry={() => { setEditingEntry(null); setActiveTab('new') }}
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
            onPinEntry={handlePinEntry}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView cryptoKey={cryptoKey} />
        )}
        {activeTab === 'new' && (
          <NewEntry
            cryptoKey={cryptoKey}
            onSubmitted={handleEntrySubmitted}
            onCancel={() => { setEditingEntry(null); setActiveTab('feed') }}
            editingEntry={editingEntry}
          />
        )}
        {activeTab === 'pet' && (
          <PetCompanion />
        )}
        {activeTab === 'settings' && (
          <Settings onLock={handleLock} cryptoKey={cryptoKey} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active={activeTab} onChange={(tab) => { setEditingEntry(null); setActiveTab(tab as Tab) }} />
    </div>
  )
}
