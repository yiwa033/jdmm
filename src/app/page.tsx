'use client'

import { useState, useCallback } from 'react'
import LockScreen from '@/components/diary/LockScreen'
import MainFeed from '@/components/diary/MainFeed'
import NewEntry from '@/components/diary/NewEntry'
import CalendarView from '@/components/diary/CalendarView'
import Settings from '@/components/diary/Settings'
import BottomNav from '@/components/diary/BottomNav'

type Tab = 'feed' | 'calendar' | 'new' | 'settings'

export default function Home() {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('feed')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUnlock = useCallback((key: CryptoKey) => {
    setCryptoKey(key)
  }, [])

  const handleLock = useCallback(() => {
    setCryptoKey(null)
    setActiveTab('feed')
  }, [])

  const handleEntrySubmitted = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
    setActiveTab('feed')
  }, [])

  const handleDeleteEntry = useCallback((_id: string) => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Show lock screen if not unlocked
  if (!cryptoKey) {
    return <LockScreen onUnlock={handleUnlock} />
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
            onNewEntry={() => setActiveTab('new')}
            onDeleteEntry={handleDeleteEntry}
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
            onCancel={() => setActiveTab('feed')}
          />
        )}
        {activeTab === 'settings' && (
          <Settings onLock={handleLock} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
