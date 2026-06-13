'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heart, Utensils, Sparkles, Palette, Baby, Cat, Dog, Rabbit, Squirrel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PetAchievements from './PetAchievements'
import { getPixelPet, getPetMood } from './PixelPet'

interface PetData {
  id: string
  petType: string
  name: string
  level: number
  exp: number
  happiness: number
  fullness: number
  energy: number
  diaryCount: number
  createdAt: string
}

const PET_TYPES = [
  { value: 'cat', label: '小猫', icon: Cat, color: '#F5A623' },
  { value: 'dog', label: '小狗', icon: Dog, color: '#D4A574' },
  { value: 'rabbit', label: '兔子', icon: Rabbit, color: '#F0E0E8' },
  { value: 'hamster', label: '仓鼠', icon: Squirrel, color: '#F5D6A0' },
]

const PET_MESSAGES: Record<string, string[]> = {
  happy: [
    '今天好开心呀~ 🎉',
    '和你在一起真幸福！',
    '嘿嘿，心情超好的~',
    '今天也是元气满满的一天！',
  ],
  normal: [
    '嗯...还不错~',
    '今天的天气真好呢~',
    '陪我玩一会吧~',
    '在想什么呢？',
  ],
  sad: [
    '有点不开心...😢',
    '好饿呀，给我点吃的吧...',
    '好久没理我了...',
    '我想你了...',
  ],
  hungry: [
    '肚子咕咕叫了...🍖',
    '好饿好饿~ 给我点吃的吧！',
    '想吃小鱼干...',
  ],
  tired: [
    '好困...想睡觉了 💤',
    '让我休息一下嘛...',
    '打了个大大的哈欠~',
  ],
}

function getRandomMsg(category: string): string {
  const msgs = PET_MESSAGES[category] || PET_MESSAGES.normal
  return msgs[Math.floor(Math.random() * msgs.length)]
}

function getMoodCategory(happiness: number, fullness: number, energy: number): string {
  if (fullness < 30) return 'hungry'
  if (energy < 30) return 'tired'
  if (happiness >= 70) return 'happy'
  if (happiness >= 40) return 'normal'
  return 'sad'
}

function getBarColor(value: number, type: 'happy' | 'food' | 'energy'): string {
  if (value >= 70) {
    return type === 'happy' ? '#E8A0BF' : type === 'food' ? '#F2C57C' : '#A5D6A7'
  }
  if (value >= 40) {
    return '#FFD54F'
  }
  return '#E57373'
}

function expToNextLevel(level: number): number {
  return level * 100
}

// Pixel art decorative elements
const PIXEL_HEART = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect x="1" y="1" width="2" height="2" fill="#E8A0BF"/><rect x="5" y="1" width="2" height="2" fill="#E8A0BF"/><rect x="0" y="2" width="8" height="2" fill="#E8A0BF"/><rect x="1" y="4" width="6" height="2" fill="#E8A0BF"/><rect x="2" y="6" width="4" height="1" fill="#E8A0BF"/><rect x="3" y="7" width="2" height="1" fill="#E8A0BF"/></svg>`

const PIXEL_STAR = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect x="3" y="0" width="2" height="2" fill="#FFD54F"/><rect x="0" y="3" width="2" height="2" fill="#FFD54F"/><rect x="3" y="3" width="2" height="2" fill="#FFD54F"/><rect x="6" y="3" width="2" height="2" fill="#FFD54F"/><rect x="3" y="6" width="2" height="2" fill="#FFD54F"/></svg>`

export default function PetCompanion() {
  const [pet, setPet] = useState<PetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionAnimation, setActionAnimation] = useState<'feed' | 'pet' | 'play' | 'levelup' | null>(null)
  const [message, setMessage] = useState('')
  const [showNameEditor, setShowNameEditor] = useState(false)
  const [editName, setEditName] = useState('')
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [bounce, setBounce] = useState(false)

  const loadPet = useCallback(async () => {
    try {
      const res = await fetch('/api/pet')
      const data = await res.json()
      setPet(data)
    } catch (e) {
      console.error('Load pet failed:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPet()
  }, [loadPet])

  // Random message every 30 seconds
  useEffect(() => {
    if (!pet) return
    const showMsg = () => {
      const category = getMoodCategory(pet.happiness, pet.fullness, pet.energy)
      setMessage(getRandomMsg(category))
    }
    showMsg()
    const timer = setInterval(showMsg, 30000)
    return () => clearInterval(timer)
  }, [pet?.happiness, pet?.fullness, pet?.energy])

  const performAction = async (action: 'feed' | 'pet' | 'play') => {
    if (!pet) return
    setActionAnimation(action)
    setBounce(true)
    setTimeout(() => setBounce(false), 600)

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      // Check for level up
      if (data.level > pet.level) {
        setActionAnimation('levelup')
        setMessage(`🎉 升级啦！${pet.name} 升到了 ${data.level} 级！`)
      } else {
        const msgs: Record<string, string[]> = {
          feed: ['好好吃呀~ 😋', '谢谢你喂我！', '饱饱的，好幸福~'],
          pet: ['好舒服呀~ 💕', '再摸摸我嘛~', '喵呜~（满足地眯眼）'],
          play: ['好好玩！🤸', '再来一次再来一次！', '嘻嘻，真开心~'],
        }
        const actionMsgs = msgs[action] || msgs.pet
        setMessage(actionMsgs[Math.floor(Math.random() * actionMsgs.length)])
      }
      setPet(data)
    } catch (e) {
      console.error('Pet action failed:', e)
    }
    setTimeout(() => setActionAnimation(null), 1500)
  }

  const handleNameChange = async () => {
    if (!pet || !editName.trim()) return
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const data = await res.json()
      setPet(data)
      setShowNameEditor(false)
      setMessage(`从今以后叫我 ${editName.trim()} 吧~ 💕`)
    } catch (e) {
      console.error('Rename pet failed:', e)
    }
  }

  const handleTypeChange = async (type: string) => {
    if (!pet) return
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petType: type }),
      })
      const data = await res.json()
      setPet(data)
      setShowTypeSelector(false)
      setMessage('换个新造型，换个好心情~ ✨')
    } catch (e) {
      console.error('Change pet type failed:', e)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pb-24">
        <div className="text-[#E8A0BF] animate-pulse">加载中...</div>
      </div>
    )
  }

  if (!pet) return null

  const petTypeInfo = PET_TYPES.find((t) => t.value === pet.petType) || PET_TYPES[0]
  const petMood = getPetMood(pet.happiness, pet.fullness, pet.energy)
  const pixelPetSvg = getPixelPet(pet.petType, petMood)
  const expProgress = pet.exp % 100
  const expNeeded = expToNextLevel(pet.level)
  const daysTogether = Math.max(1, Math.ceil((Date.now() - new Date(pet.createdAt).getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-4">
      {/* Pet Display Area */}
      <div className="bg-gradient-to-b from-[#FFF0F5] to-[#FFF8F0] dark:from-[#3A2028] dark:to-[#2A1F1E] rounded-3xl p-6 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 relative overflow-hidden">
        {/* Floating pixel particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {actionAnimation === 'pet' && (
            <>
              <span className="absolute animate-float-up w-6 h-6" style={{ left: '20%', top: '30%', imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: PIXEL_HEART }}
              />
              <span className="absolute animate-float-up w-5 h-5" style={{ left: '60%', top: '20%', animationDelay: '0.2s', imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: PIXEL_HEART }}
              />
              <span className="absolute animate-float-up w-6 h-6" style={{ left: '40%', top: '40%', animationDelay: '0.4s', imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: PIXEL_HEART }}
              />
            </>
          )}
          {actionAnimation === 'feed' && (
            <>
              <span className="absolute animate-float-up text-xl" style={{ left: '25%', top: '30%' }}>🍖</span>
              <span className="absolute animate-float-up text-lg" style={{ left: '55%', top: '25%', animationDelay: '0.2s' }}>🐟</span>
              <span className="absolute animate-float-up text-xl" style={{ left: '70%', top: '35%', animationDelay: '0.4s' }}>🥛</span>
            </>
          )}
          {actionAnimation === 'play' && (
            <>
              <span className="absolute animate-float-up w-6 h-6" style={{ left: '20%', top: '30%', imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: PIXEL_STAR }}
              />
              <span className="absolute animate-float-up text-lg" style={{ left: '50%', top: '20%', animationDelay: '0.2s' }}>✨</span>
              <span className="absolute animate-float-up w-5 h-5" style={{ left: '75%', top: '35%', animationDelay: '0.4s', imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: PIXEL_STAR }}
              />
            </>
          )}
          {actionAnimation === 'levelup' && (
            <>
              <span className="absolute animate-float-up text-2xl" style={{ left: '15%', top: '25%' }}>🎉</span>
              <span className="absolute animate-float-up text-2xl" style={{ left: '45%', top: '15%' }}>🎊</span>
              <span className="absolute animate-float-up text-2xl" style={{ left: '75%', top: '30%' }}>⬆️</span>
              <span className="absolute animate-float-up w-5 h-5" style={{ left: '30%', top: '40%', animationDelay: '0.3s', imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: PIXEL_STAR }}
              />
              <span className="absolute animate-float-up w-6 h-6" style={{ left: '60%', top: '35%', animationDelay: '0.5s', imageRendering: 'pixelated' }}
                dangerouslySetInnerHTML={{ __html: PIXEL_STAR }}
              />
            </>
          )}
        </div>

        {/* Pet character - Pixel Art! */}
        <div className="flex flex-col items-center">
          <div
            className={`w-32 h-32 transition-all duration-300 select-none ${
              bounce ? 'animate-bounce' : ''
            } ${
              actionAnimation === 'feed' ? 'animate-wiggle' : ''
            } ${
              !bounce && !actionAnimation ? 'animate-pet-idle' : ''
            }`}
            style={{
              imageRendering: 'pixelated',
              filter: pet.happiness < 30 ? 'grayscale(30%)' : 'none',
            }}
            dangerouslySetInnerHTML={{ __html: pixelPetSvg }}
          />

          {/* Name & Level */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => { setEditName(pet.name); setShowNameEditor(true) }}
              className="text-lg font-bold text-[#3D2C2E] dark:text-[#F5E6D3] hover:text-[#E8A0BF] transition-colors"
            >
              {pet.name}
            </button>
            <span className="px-2 py-0.5 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white text-xs rounded-full font-bold">
              Lv.{pet.level}
            </span>
          </div>

          {/* EXP bar */}
          <div className="w-48 mt-2">
            <div className="flex justify-between text-[10px] text-[#B8A8AC] mb-1">
              <span>经验值</span>
              <span>{expProgress}/{expNeeded}</span>
            </div>
            <div className="h-2 bg-white/50 dark:bg-[#1A1614]/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] transition-all duration-500"
                style={{ width: `${(expProgress / expNeeded) * 100}%` }}
              />
            </div>
          </div>

          {/* Speech bubble */}
          {message && (
            <div className="mt-3 bg-white/80 dark:bg-[#1A1614]/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 max-w-[250px] relative">
              <p className="text-sm text-[#3D2C2E] dark:text-[#F5E6D3] text-center">{message}</p>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/80 dark:bg-[#1A1614]/80 border-b border-r border-[#E8D5DE]/40 dark:border-[#4A3540]/40 transform rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Status Bars */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 space-y-3">
        <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3] mb-1">宠物状态</h3>

        {/* Happiness */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-[#9B8A8E]">
              <Heart className="w-3.5 h-3.5" /> 心情
            </span>
            <span className="font-mono" style={{ color: getBarColor(pet.happiness, 'happy') }}>{pet.happiness}</span>
          </div>
          <div className="h-3 bg-[#F5E6D3]/50 dark:bg-[#3A2A20]/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pet.happiness}%`,
                backgroundColor: getBarColor(pet.happiness, 'happy'),
              }}
            />
          </div>
        </div>

        {/* Fullness */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-[#9B8A8E]">
              <Utensils className="w-3.5 h-3.5" /> 饱腹
            </span>
            <span className="font-mono" style={{ color: getBarColor(pet.fullness, 'food') }}>{pet.fullness}</span>
          </div>
          <div className="h-3 bg-[#F5E6D3]/50 dark:bg-[#3A2A20]/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pet.fullness}%`,
                backgroundColor: getBarColor(pet.fullness, 'food'),
              }}
            />
          </div>
        </div>

        {/* Energy */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-[#9B8A8E]">
              <Sparkles className="w-3.5 h-3.5" /> 精力
            </span>
            <span className="font-mono" style={{ color: getBarColor(pet.energy, 'energy') }}>{pet.energy}</span>
          </div>
          <div className="h-3 bg-[#F5E6D3]/50 dark:bg-[#3A2A20]/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pet.energy}%`,
                backgroundColor: getBarColor(pet.energy, 'energy'),
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={() => performAction('feed')}
          disabled={pet.fullness >= 100 || actionAnimation !== null}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-gradient-to-b from-[#FFF8F0] to-[#FFE4B5] dark:from-[#3A3020] dark:to-[#2A2010] border border-[#F2C57C]/50 dark:border-[#6A5020]/50 text-[#3D2C2E] dark:text-[#F5E6D3] hover:shadow-lg rounded-2xl disabled:opacity-50"
        >
          <span className="text-2xl">🍖</span>
          <span className="text-xs font-medium">喂食</span>
        </Button>
        <Button
          onClick={() => performAction('pet')}
          disabled={actionAnimation !== null}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-gradient-to-b from-[#FFF0F5] to-[#FFD6E7] dark:from-[#3A2028] dark:to-[#2A1018] border border-[#E8A0BF]/50 dark:border-[#6A3040]/50 text-[#3D2C2E] dark:text-[#F5E6D3] hover:shadow-lg rounded-2xl disabled:opacity-50"
        >
          <span className="text-2xl">🤗</span>
          <span className="text-xs font-medium">抚摸</span>
        </Button>
        <Button
          onClick={() => performAction('play')}
          disabled={pet.energy < 10 || actionAnimation !== null}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-gradient-to-b from-[#F0FFF0] to-[#C8F7C8] dark:from-[#1A2A1A] dark:to-[#102A10] border border-[#A5D6A7]/50 dark:border-[#2A5A2A]/50 text-[#3D2C2E] dark:text-[#F5E6D3] hover:shadow-lg rounded-2xl disabled:opacity-50"
        >
          <span className="text-2xl">🎾</span>
          <span className="text-xs font-medium">玩耍</span>
        </Button>
      </div>

      {/* Achievements */}
      <PetAchievements pet={pet} />

      {/* Pet Type Selector - with pixel previews */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#E8A0BF]" />
            <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">宠物外观</h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#FFF0F5] dark:bg-[#3A2028] rounded-full text-[#E8A0BF]">像素风</span>
          </div>
          <Button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            variant="ghost"
            className="text-xs text-[#9B8A8E] h-7 rounded-xl"
          >
            {showTypeSelector ? '收起' : '更换'}
          </Button>
        </div>
        {showTypeSelector && (
          <div className="grid grid-cols-4 gap-2">
            {PET_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all active:scale-95 ${
                  pet.petType === type.value
                    ? 'bg-[#FFF0F5] dark:bg-[#3A2028] border-2 border-[#E8A0BF]'
                    : 'bg-white/50 dark:bg-[#1A1614]/50 border border-[#E8D5DE]/30 dark:border-[#4A3540]/30'
                }`}
              >
                <div className="w-10 h-10" style={{ imageRendering: 'pixelated' }}
                  dangerouslySetInnerHTML={{ __html: getPixelPet(type.value, 'happy') }}
                />
                <span className="text-xs text-[#9B8A8E]">{type.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Name Editor Modal */}
      {showNameEditor && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white dark:bg-[#2A1F1E] rounded-3xl p-6 w-full max-w-xs border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Baby className="w-5 h-5 text-[#E8A0BF]" />
              <h3 className="text-base font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">给宠物起名</h3>
            </div>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="输入一个可爱的名字"
              maxLength={8}
              className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowNameEditor(false)} variant="ghost" className="flex-1 rounded-xl">取消</Button>
              <Button onClick={handleNameChange} className="flex-1 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl">确认</Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3] mb-3">成长记录</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-[#FFF0F5]/50 dark:bg-[#3A2028]/50 rounded-xl">
            <p className="text-2xl font-bold bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] bg-clip-text text-transparent">{daysTogether}</p>
            <p className="text-[10px] text-[#9B8A8E] mt-1">相伴天数</p>
          </div>
          <div className="text-center p-3 bg-[#FFF8F0]/50 dark:bg-[#3A3020]/50 rounded-xl">
            <p className="text-2xl font-bold bg-gradient-to-r from-[#F2C57C] to-[#FFD54F] bg-clip-text text-transparent">{pet.diaryCount}</p>
            <p className="text-[10px] text-[#9B8A8E] mt-1">陪伴写日记</p>
          </div>
          <div className="text-center p-3 bg-[#F0FFF0]/50 dark:bg-[#1A2A1A]/50 rounded-xl">
            <p className="text-2xl font-bold bg-gradient-to-r from-[#A5D6A7] to-[#81C784] bg-clip-text text-transparent">{pet.level}</p>
            <p className="text-[10px] text-[#9B8A8E] mt-1">当前等级</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-[#FFF0F5]/30 dark:bg-[#3A2028]/20 rounded-2xl p-4 border border-[#E8D5DE]/20 dark:border-[#4A3540]/20">
        <h3 className="text-xs font-medium text-[#9B8A8E] mb-2">养育小贴士</h3>
        <ul className="space-y-1 text-[10px] text-[#B8A8AC]">
          <li>• 写日记时宠物也会获得经验值和好心情</li>
          <li>• 宠物的饱腹度和心情会随时间慢慢降低</li>
          <li>• 每100经验值升一级，写日记升级最快</li>
          <li>• 精力不足时玩耍会失败，让宠物休息一会吧</li>
          <li>• 点击宠物名字可以给它改名字哦</li>
          <li>• 完成特定目标可解锁成就徽章 🏆</li>
          <li>• 心情不好？去心灵伙伴那里聊聊吧 💕</li>
        </ul>
      </div>
    </div>
  )
}
