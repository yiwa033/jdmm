'use client'

import { Home, CalendarPlus, PlusCircle, Settings, MessageCircleHeart, Cat } from 'lucide-react'

type Tab = 'feed' | 'calendar' | 'new' | 'pet' | 'chat' | 'settings'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1A1614]/90 backdrop-blur-lg border-t border-[#E8D5DE]/30 dark:border-[#4A3540]/30 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <button
          onClick={() => onChange('feed')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
            active === 'feed' ? 'text-[#E8A0BF]' : 'text-[#B8A8AC] dark:text-[#6A5A5E]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">动态</span>
        </button>

        <button
          onClick={() => onChange('calendar')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
            active === 'calendar' ? 'text-[#E8A0BF]' : 'text-[#B8A8AC] dark:text-[#6A5A5E]'
          }`}
        >
          <CalendarPlus className="w-5 h-5" />
          <span className="text-[10px]">日历</span>
        </button>

        {/* Center New Button */}
        <button
          onClick={() => onChange('new')}
          className="flex items-center justify-center -mt-4"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 bg-gradient-to-br from-[#E8A0BF] to-[#F2C57C] ${active === 'new' ? 'shadow-[#E8A0BF]/30' : 'shadow-[#E8A0BF]/20'}`}>
            {active === 'new' ? (
              <PlusCircle className="w-6 h-6 text-white" />
            ) : (
              <PlusCircle className="w-6 h-6 text-white" />
            )}
          </div>
        </button>

        <button
          onClick={() => onChange('chat')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors relative ${
            active === 'chat' ? 'text-[#E8A0BF]' : 'text-[#B8A8AC] dark:text-[#6A5A5E]'
          }`}
        >
          <MessageCircleHeart className="w-5 h-5" />
          <span className="text-[10px]">陪伴</span>
          {/* New feature badge */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#E8A0BF] rounded-full animate-pulse" />
        </button>

        <button
          onClick={() => onChange('settings')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
            active === 'settings' ? 'text-[#E8A0BF]' : 'text-[#B8A8AC] dark:text-[#6A5A5E]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">我的</span>
        </button>
      </div>
    </div>
  )
}
