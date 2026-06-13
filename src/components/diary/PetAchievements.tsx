'use client'

import { Trophy, Star, PenLine, Heart, Zap, Calendar, Crown, Flame } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  desc: string
  icon: React.ReactNode
  condition: (pet: { level: number; diaryCount: number; happiness: number; createdAt: string }) => boolean
  color: string
  bgColor: string
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_diary',
    title: '初见',
    desc: '第一次写日记',
    icon: <PenLine className="w-5 h-5" />,
    condition: (p) => p.diaryCount >= 1,
    color: '#E8A0BF',
    bgColor: '#FFF0F5',
  },
  {
    id: 'diary_5',
    title: '小作家',
    desc: '累计写5篇日记',
    icon: <Star className="w-5 h-5" />,
    condition: (p) => p.diaryCount >= 5,
    color: '#F2C57C',
    bgColor: '#FFF8F0',
  },
  {
    id: 'diary_20',
    title: '笔耕不辍',
    desc: '累计写20篇日记',
    icon: <PenLine className="w-5 h-5" />,
    condition: (p) => p.diaryCount >= 20,
    color: '#A5D6A7',
    bgColor: '#F0FFF0',
  },
  {
    id: 'diary_50',
    title: '日记达人',
    desc: '累计写50篇日记',
    icon: <Crown className="w-5 h-5" />,
    condition: (p) => p.diaryCount >= 50,
    color: '#FFD54F',
    bgColor: '#FFFEF0',
  },
  {
    id: 'level_5',
    title: '茁壮成长',
    desc: '宠物达到5级',
    icon: <Zap className="w-5 h-5" />,
    condition: (p) => p.level >= 5,
    color: '#A8D8EA',
    bgColor: '#F0F8FF',
  },
  {
    id: 'level_10',
    title: '实力派',
    desc: '宠物达到10级',
    icon: <Trophy className="w-5 h-5" />,
    condition: (p) => p.level >= 10,
    color: '#CE93D8',
    bgColor: '#FAF0FF',
  },
  {
    id: 'happy_pet',
    title: '幸福满满',
    desc: '宠物心情达到90',
    icon: <Heart className="w-5 h-5" />,
    condition: (p) => p.happiness >= 90,
    color: '#E8A0BF',
    bgColor: '#FFF0F5',
  },
  {
    id: 'days_7',
    title: '一周之约',
    desc: '相伴满7天',
    icon: <Calendar className="w-5 h-5" />,
    condition: (p) => {
      const days = Math.ceil((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return days >= 7
    },
    color: '#FF8A65',
    bgColor: '#FFF5F0',
  },
  {
    id: 'days_30',
    title: '月度伴侣',
    desc: '相伴满30天',
    icon: <Flame className="w-5 h-5" />,
    condition: (p) => {
      const days = Math.ceil((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return days >= 30
    },
    color: '#EF5350',
    bgColor: '#FFF0F0',
  },
]

interface PetAchievementsProps {
  pet: {
    level: number
    diaryCount: number
    happiness: number
    createdAt: string
  }
}

export default function PetAchievements({ pet }: PetAchievementsProps) {
  const unlocked = ACHIEVEMENTS.filter((a) => a.condition(pet))
  const locked = ACHIEVEMENTS.filter((a) => !a.condition(pet))

  return (
    <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#F2C57C]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">成就徽章</h3>
        </div>
        <span className="text-[10px] text-[#9B8A8E]">{unlocked.length}/{ACHIEVEMENTS.length} 已解锁</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#F5E6D3]/50 dark:bg-[#3A2A20]/50 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F2C57C] to-[#E8A0BF] transition-all duration-700"
          style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>

      {/* Unlocked achievements */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {unlocked.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all"
              style={{
                backgroundColor: a.bgColor + '80',
                borderColor: a.color + '40',
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: a.color + '30', color: a.color }}
              >
                {a.icon}
              </div>
              <span className="text-[10px] font-medium text-[#3D2C2E] dark:text-[#F5E6D3] text-center leading-tight">
                {a.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Locked achievements */}
      {locked.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {locked.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-[#E8D5DE]/20 dark:border-[#4A3540]/20 bg-white/30 dark:bg-[#1A1614]/30 opacity-50"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 text-[#B8A8AC]">
                <span className="text-sm">🔒</span>
              </div>
              <span className="text-[10px] text-[#B8A8AC] text-center leading-tight">{a.title}</span>
              <span className="text-[8px] text-[#C8B8BC] text-center leading-tight">{a.desc}</span>
            </div>
          ))}
        </div>
      )}

      {unlocked.length === 0 && (
        <p className="text-xs text-[#B8A8AC] text-center py-3">
          继续写日记和照顾宠物，解锁更多成就吧~
        </p>
      )}
    </div>
  )
}
