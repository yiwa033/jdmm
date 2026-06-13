'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, ShieldCheck, Info, Eye, Smartphone, Clock, AlertTriangle, Camera, EyeOff, Download, Upload, Moon, Sun, BarChart3, BookOpen, Flame, FileText, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { decrypt } from '@/lib/crypto'

interface LoginLogEntry {
  id: string
  ip: string
  userAgent: string
  success: boolean
  createdAt: string
}

interface IntruderPhotoEntry {
  id: string
  photoData: string
  ip: string
  userAgent: string
  createdAt: string
}

interface SettingsProps {
  onLock: () => void
  cryptoKey: CryptoKey
  autoLockMs: number
  onAutoLockChange: (ms: number) => void
}

const AUTO_LOCK_PRESETS = [
  { label: '30秒', value: 30000 },
  { label: '1分钟', value: 60000 },
  { label: '3分钟', value: 180000 },
  { label: '5分钟', value: 300000 },
  { label: '10分钟', value: 600000 },
  { label: '30分钟', value: 1800000 },
]

function formatAutoLock(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}秒`
  if (ms < 3600000) {
    const mins = ms / 60000
    return Number.isInteger(mins) ? `${mins}分钟` : `${(ms / 60000).toFixed(1)}分钟`
  }
  return `${Math.round(ms / 3600000)}小时`
}

function parseUserAgent(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android/i.test(ua)) return 'Android'
  if (/Mac/i.test(ua)) return 'Mac'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Linux/i.test(ua)) return 'Linux'
  return '未知设备'
}

function parseBrowser(ua: string): string {
  if (/Edg/i.test(ua)) return 'Edge'
  if (/Chrome/i.test(ua)) return 'Chrome'
  if (/Safari/i.test(ua)) return 'Safari'
  if (/Firefox/i.test(ua)) return 'Firefox'
  return '浏览器'
}

export default function Settings({ onLock, cryptoKey, autoLockMs, onAutoLockChange }: SettingsProps) {
  const [changingPin, setChangingPin] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>([])
  const [intruderPhotos, setIntruderPhotos] = useState<IntruderPhotoEntry[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [settingDecoy, setSettingDecoy] = useState(false)
  const [decoyPin, setDecoyPin] = useState('')
  const [confirmDecoyPin, setConfirmDecoyPin] = useState('')
  const [hasDecoy, setHasDecoy] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [stats, setStats] = useState({ totalEntries: 0, totalChars: 0, streak: 0, totalWords: 0 })
  const [showCustomLock, setShowCustomLock] = useState(false)
  const [customLockMin, setCustomLockMin] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load data
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [logRes, photoRes] = await Promise.all([
          fetch('/api/log/login'),
          fetch('/api/log/intruder'),
        ])
        const logData = await logRes.json()
        const photoData = await photoRes.json()
        if (cancelled) return
        setLoginLogs(logData.logs || [])
        setOpenCount(logData.openCount || 0)
        setIntruderPhotos(photoData || [])
      } catch (e) {
        console.error('Load settings data failed:', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load stats from diary entries
  useEffect(() => {
    let cancelled = false
    const loadStats = async () => {
      try {
        const res = await fetch('/api/diary')
        const data = await res.json()
        if (cancelled) return

        let totalChars = 0
        let totalWords = 0
        const dates = new Set<string>()

        for (const entry of data) {
          try {
            const contentJson = await decrypt(entry.encryptedContent, cryptoKey)
            const content = JSON.parse(contentJson)
            totalChars += (content.text || '').length
            totalWords += (content.text || '').trim() ? (content.text || '').trim().split(/\s+/).length : 0
            dates.add(entry.entryDate)
          } catch {
            // skip
          }
        }

        // Calculate writing streak
        const sortedDates = Array.from(dates).sort().reverse()
        let streak = 0
        const today = new Date()
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(checkDate.getDate() - i)
          const dateStr = checkDate.toISOString().slice(0, 10)
          if (dates.has(dateStr)) {
            streak++
          } else if (i > 0) {
            break
          }
        }

        setStats({ totalEntries: data.length, totalChars, streak, totalWords })
      } catch (e) {
        console.error('Load stats failed:', e)
      }
    }
    loadStats()
    return () => { cancelled = true }
  }, [cryptoKey])

  // Theme toggle
  useEffect(() => {
    const saved = localStorage.getItem('diary-theme')
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('diary-theme', next ? 'dark' : 'light')
  }

  const handleChangePin = async () => {
    setError('')
    setMessage('')
    if (!/^\d{4}$/.test(newPin)) { setError('新密码必须是4位数字'); return }
    if (newPin !== confirmPin) { setError('两次输入不一致'); return }
    try {
      const oldHash = await hashPinLocal(oldPin)
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: oldHash }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.valid || verifyData.mode !== 'real') { setError('旧密码错误'); return }
      const newSalt = generateSaltLocal()
      const newHash = await hashPinLocal(newPin)
      await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newHash, salt: newSalt }),
      })
      setMessage('密码修改成功！请重新解锁')
      setChangingPin(false)
      setOldPin(''); setNewPin(''); setConfirmPin('')
      setTimeout(() => onLock(), 1500)
    } catch {
      setError('修改失败，请重试')
    }
  }

  const handleSetDecoy = async () => {
    setError('')
    setMessage('')
    if (!/^\d{4}$/.test(decoyPin)) { setError('伪装密码必须是4位数字'); return }
    if (decoyPin !== confirmDecoyPin) { setError('两次输入不一致'); return }
    try {
      const decoySalt = generateSaltLocal()
      const decoyHash = await hashPinLocal(decoyPin)
      await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decoyPin: decoyHash, decoySalt }),
      })
      setHasDecoy(true)
      setSettingDecoy(false)
      setDecoyPin(''); setConfirmDecoyPin('')
      setMessage('伪装密码设置成功！别人输这个密码只能看到空日记')
    } catch {
      setError('设置失败，请重试')
    }
  }

  // Export data
  const handleExport = async () => {
    try {
      setMessage('正在导出...')
      const res = await fetch('/api/diary')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `心语日记_备份_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('导出成功！文件已下载')
    } catch {
      setError('导出失败')
    }
  }

  // Import data
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setMessage('正在导入...')
      const text = await file.text()
      const entries = JSON.parse(text)
      if (!Array.isArray(entries)) { setError('无效的备份文件'); return }

      let imported = 0
      for (const entry of entries) {
        if (entry.encryptedContent && entry.entryDate) {
          try {
            await fetch('/api/diary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                encryptedContent: entry.encryptedContent,
                encryptedImage: entry.encryptedImage || null,
                entryDate: entry.entryDate,
              }),
            })
            imported++
          } catch {
            // skip failed
          }
        }
      }
      setMessage(`导入完成！成功导入 ${imported} 条日记`)
    } catch {
      setError('导入失败，请检查文件格式')
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-4">
      <h2 className="text-lg font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">个人中心</h2>

      {/* Writing Stats */}
      <div className="p-4 bg-gradient-to-r from-[#FFF0F5] to-[#FFF8F0] dark:from-[#3A2028] dark:to-[#2A1F1E] rounded-2xl border border-[#E8D5DE]/30 dark:border-[#4A3540]/30">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-[#E8A0BF]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">写作统计</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/60 dark:bg-[#1A1614]/40 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-[#E8A0BF]" />
              <span className="text-[10px] text-[#9B8A8E]">总日记</span>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] bg-clip-text text-transparent">{stats.totalEntries}</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-[#1A1614]/40 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[#F2C57C]" />
              <span className="text-[10px] text-[#9B8A8E]">总字数</span>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#F2C57C] to-[#FFD54F] bg-clip-text text-transparent">{stats.totalChars.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-[#1A1614]/40 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-[#E57373]" />
              <span className="text-[10px] text-[#9B8A8E]">连续天数</span>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#E57373] to-[#FF8A65] bg-clip-text text-transparent">{stats.streak}</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-[#1A1614]/40 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="w-3.5 h-3.5 text-[#A5D6A7]" />
              <span className="text-[10px] text-[#9B8A8E]">打开次数</span>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#A5D6A7] to-[#66BB6A] bg-clip-text text-transparent">{openCount}</p>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="w-full flex items-center gap-3 p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 rounded-full bg-[#FFF8F0] dark:bg-[#3A3020] flex items-center justify-center">
          {isDark ? <Moon className="w-5 h-5 text-[#F2C57C]" /> : <Sun className="w-5 h-5 text-[#E8A0BF]" />}
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3]">
            {isDark ? '深色模式' : '浅色模式'}
          </p>
          <p className="text-xs text-[#9B8A8E]">点击切换主题</p>
        </div>
        <div className={`w-12 h-6 rounded-full transition-colors flex items-center ${isDark ? 'bg-[#E8A0BF] justify-end' : 'bg-[#E8D5DE] justify-start'}`}>
          <div className="w-5 h-5 bg-white rounded-full mx-0.5 shadow-sm transition-all" />
        </div>
      </button>

      {/* Auto Lock Time */}
      <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-5 h-5 text-[#E8A0BF]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">自动锁定</h3>
          <span className="text-[10px] bg-[#FFF0F5] dark:bg-[#3A2028] text-[#E8A0BF] px-2 py-0.5 rounded-full">
            {formatAutoLock(autoLockMs)}
          </span>
        </div>
        <p className="text-xs text-[#9B8A8E] dark:text-[#A89890] mb-3">
          无操作一段时间后自动锁定日记，保护你的隐私。
        </p>
        {/* Quick presets */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {AUTO_LOCK_PRESETS.map((option) => (
            <button
              key={option.value}
              onClick={() => { onAutoLockChange(option.value); setShowCustomLock(false) }}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                autoLockMs === option.value && !showCustomLock
                  ? 'bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white shadow-sm'
                  : 'bg-white/60 dark:bg-[#1A1614]/40 text-[#9B8A8E] border border-[#E8D5DE]/30 dark:border-[#4A3540]/30'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {/* Custom time */}
        {!showCustomLock ? (
          <button
            onClick={() => setShowCustomLock(true)}
            className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
              !AUTO_LOCK_PRESETS.some((o) => o.value === autoLockMs)
                ? 'bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white shadow-sm'
                : 'bg-white/60 dark:bg-[#1A1614]/40 text-[#9B8A8E] border border-[#E8D5DE]/30 dark:border-[#4A3540]/30'
            }`}
          >
            {!AUTO_LOCK_PRESETS.some((o) => o.value === autoLockMs) ? `自定义 · ${formatAutoLock(autoLockMs)}` : '⏱ 自定义时间'}
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-scale-in">
            <div className="flex-1 relative">
              <Input
                type="number"
                inputMode="numeric"
                min="10"
                max="120"
                value={customLockMin}
                onChange={(e) => setCustomLockMin(e.target.value)}
                placeholder="输入分钟数"
                className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl h-10 text-sm pr-10"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9B8A8E]">分钟</span>
            </div>
            <Button
              onClick={() => {
                const mins = parseInt(customLockMin, 10)
                if (mins >= 1 && mins <= 120) {
                  onAutoLockChange(mins * 60000)
                  setShowCustomLock(false)
                  setCustomLockMin('')
                }
              }}
              className="bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl h-10 px-4 text-sm"
            >
              确定
            </Button>
            <Button
              onClick={() => { setShowCustomLock(false); setCustomLockMin('') }}
              variant="ghost"
              className="rounded-xl h-10 px-3 text-sm text-[#9B8A8E]"
            >
              取消
            </Button>
          </div>
        )}
        {showCustomLock && customLockMin && (parseInt(customLockMin, 10) < 1 || parseInt(customLockMin, 10) > 120) && (
          <p className="text-[10px] text-red-400 mt-1.5">请输入1~120之间的分钟数</p>
        )}
      </div>

      {/* Data Export / Import */}
      <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-[#E8A0BF]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">数据管理</h3>
        </div>
        <p className="text-xs text-[#9B8A8E] dark:text-[#A89890] mb-3">
          导出备份为加密文件，可导入恢复。数据已加密，只有用正确密码才能读取。
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            className="flex-1 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl h-9 text-sm"
          >
            <Download className="w-4 h-4 mr-1" />导出备份
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1 rounded-xl h-9 text-sm border-[#E8D5DE]/40 dark:border-[#4A3540]/40"
          >
            <Upload className="w-4 h-4 mr-1" />导入恢复
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* Decoy Mode */}
      <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-2">
          <EyeOff className="w-5 h-5 text-[#E8A0BF]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">伪装模式</h3>
          {hasDecoy && (
            <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">已开启</span>
          )}
        </div>
        <p className="text-xs text-[#9B8A8E] dark:text-[#A89890] mb-3">
          设置一个伪装密码。别人输入伪装密码时，只会看到空的日记本，保护你的真实内容。
        </p>
        {!settingDecoy ? (
          <Button onClick={() => setSettingDecoy(true)} className="bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl h-9 text-sm">
            {hasDecoy ? '修改伪装密码' : '设置伪装密码'}
          </Button>
        ) : (
          <div className="space-y-2">
            <Input type="password" inputMode="numeric" maxLength={4} placeholder="输入4位伪装密码" value={decoyPin} onChange={(e) => setDecoyPin(e.target.value.replace(/\D/g, ''))} className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl" />
            <Input type="password" inputMode="numeric" maxLength={4} placeholder="确认伪装密码" value={confirmDecoyPin} onChange={(e) => setConfirmDecoyPin(e.target.value.replace(/\D/g, ''))} className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl" />
            <div className="flex gap-2">
              <Button onClick={() => { setSettingDecoy(false); setError('') }} variant="ghost" className="flex-1 rounded-xl">取消</Button>
              <Button onClick={handleSetDecoy} className="flex-1 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl">确认</Button>
            </div>
          </div>
        )}
      </div>

      {/* Intruder Photos */}
      {intruderPhotos.length > 0 && (
        <div className="p-4 bg-[#FFF0F0]/50 dark:bg-[#2A1A1A]/30 rounded-2xl border border-red-200/40 dark:border-red-800/40">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">入侵者拍照</h3>
            <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-500 px-2 py-0.5 rounded-full">{intruderPhotos.length}次</span>
          </div>
          <p className="text-xs text-[#9B8A8E] mb-3">密码输错3次时自动拍摄</p>
          <div className="grid grid-cols-3 gap-2">
            {intruderPhotos.map((photo) => {
              const date = new Date(photo.createdAt)
              return (
                <div key={photo.id} className="relative rounded-xl overflow-hidden group">
                  <img src={photo.photoData} alt="入侵者" className="w-full aspect-square object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-1">
                    <p className="text-[8px] text-white text-center">
                      {date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lock App */}
      <button
        onClick={onLock}
        className="w-full flex items-center gap-3 p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 rounded-full bg-[#FFF0F5] dark:bg-[#3A2028] flex items-center justify-center">
          <Lock className="w-5 h-5 text-[#E8A0BF]" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3]">锁定应用</p>
          <p className="text-xs text-[#9B8A8E]">立即锁定 · {formatAutoLock(autoLockMs)}无操作自动锁定</p>
        </div>
      </button>

      {/* Change PIN */}
      {!changingPin ? (
        <button
          onClick={() => setChangingPin(true)}
          className="w-full flex items-center gap-3 p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-full bg-[#FFF8F0] dark:bg-[#3A3020] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#F2C57C]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3]">修改密码</p>
            <p className="text-xs text-[#9B8A8E]">更改你的4位数字密码</p>
          </div>
        </button>
      ) : (
        <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 space-y-3">
          <Input type="password" inputMode="numeric" maxLength={4} placeholder="输入旧密码" value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl" />
          <Input type="password" inputMode="numeric" maxLength={4} placeholder="输入新密码" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl" />
          <Input type="password" inputMode="numeric" maxLength={4} placeholder="确认新密码" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl" />
          <div className="flex gap-2">
            <Button onClick={() => { setChangingPin(false); setError('') }} variant="ghost" className="flex-1 rounded-xl">取消</Button>
            <Button onClick={handleChangePin} className="flex-1 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl">确认修改</Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      {message && <p className="text-sm text-green-400 text-center">{message}</p>}

      {/* Login Log */}
      <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-[#E8A0BF]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">登录日志</h3>
          <span className="text-xs text-[#B8A8AC] ml-auto">最近50条</span>
        </div>
        {loginLogs.length === 0 ? (
          <p className="text-xs text-[#B8A8AC] text-center py-4">暂无登录记录</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loginLogs.map((log) => {
              const date = new Date(log.createdAt)
              const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
              const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
              const device = parseUserAgent(log.userAgent)
              const browser = parseBrowser(log.userAgent)
              return (
                <div key={log.id} className={`p-3 rounded-xl text-xs ${log.success ? 'bg-[#F0FFF0]/50 dark:bg-[#1A2A1A]/30 border border-green-200/30 dark:border-green-800/30' : 'bg-[#FFF0F0]/50 dark:bg-[#2A1A1A]/30 border border-red-200/30 dark:border-red-800/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {log.success ? <span className="text-green-500">✓ 成功</span> : <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="w-3 h-3" />失败</span>}
                    </div>
                    <span className="text-[#B8A8AC] font-mono tabular-nums">{dateStr} {timeStr}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#9B8A8E]">
                    <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" />{device} · {browser}</span>
                    <span className="flex items-center gap-1 font-mono">🌐 {log.ip}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Privacy Info */}
      <div className="p-4 bg-[#FFF0F5]/50 dark:bg-[#3A2028]/30 rounded-2xl border border-[#E8D5DE]/30 dark:border-[#4A3540]/30">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-[#E8A0BF]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">隐私保护</h3>
        </div>
        <ul className="space-y-1.5 text-xs text-[#9B8A8E] dark:text-[#A89890]">
          <li>• AES-256-GCM 端到端加密</li>
          <li>• 你的日记内容只有你自己能看</li>
          <li>• 加密密钥从不离开你的设备</li>
          <li>• 伪装模式：假密码看到空日记</li>
          <li>• 入侵拍照：输错3次自动拍下偷窥者</li>
          <li>• 自动锁定：无操作自动锁屏</li>
          <li>• 数据备份：加密导出，安全无忧</li>
          <li>• 标签分类：轻松管理你的日记</li>
          <li>• 删除确认：防止误删日记</li>
        </ul>
      </div>

      {/* App Info */}
      <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-[#F2C57C]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">关于心语日记</h3>
        </div>
        <p className="text-xs text-[#9B8A8E] dark:text-[#A89890]">
          心语日记 v2.1 — 你的私密空间，只属于你的日记。记录每一天的心情，守护每一份感受。
        </p>
      </div>
    </div>
  )
}

async function hashPinLocal(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(pin))
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateSaltLocal(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
}
