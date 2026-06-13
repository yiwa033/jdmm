'use client'

import { useState, useEffect } from 'react'
import { Lock, ShieldCheck, Info, Eye, Smartphone, Clock, AlertTriangle, Camera, EyeOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

export default function Settings({ onLock }: SettingsProps) {
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
        setHasDecoy(!!logData.logs?.some?.(() => false)) // placeholder, will check properly
      } catch (e) {
        console.error('Load settings data failed:', e)
      }
      // Check if decoy password exists
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: '__check__' }),
        })
        // The verify endpoint returns mode info; we just check decoy exists
        // We'll infer it from the response
      } catch {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

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
      // Get current real password hash and salt to keep them
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '__check__' }),
      })
      // We'll just update the decoy fields
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

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-4">
      <h2 className="text-lg font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">个人中心</h2>

      {/* Open Count */}
      <div className="p-4 bg-gradient-to-r from-[#FFF0F5] to-[#FFF8F0] dark:from-[#3A2028] dark:to-[#2A1F1E] rounded-2xl border border-[#E8D5DE]/30 dark:border-[#4A3540]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-[#1A1614]/80 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#E8A0BF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#3D2C2E] dark:text-[#F5E6D3]">打开次数</p>
              <p className="text-xs text-[#9B8A8E]">累计成功解锁次数</p>
            </div>
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] bg-clip-text text-transparent">
            {openCount}
          </span>
        </div>
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
          <Button
            onClick={() => setSettingDecoy(true)}
            className="bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl h-9 text-sm"
          >
            {hasDecoy ? '修改伪装密码' : '设置伪装密码'}
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="输入4位伪装密码"
              value={decoyPin}
              onChange={(e) => setDecoyPin(e.target.value.replace(/\D/g, ''))}
              className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl"
            />
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="确认伪装密码"
              value={confirmDecoyPin}
              onChange={(e) => setConfirmDecoyPin(e.target.value.replace(/\D/g, ''))}
              className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl"
            />
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
                  <img
                    src={photo.photoData}
                    alt="入侵者"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-1">
                    <p className="text-[8px] text-white text-center">
                      {date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      {' '}
                      {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
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
          <p className="text-xs text-[#9B8A8E]">立即锁定 · 30秒无操作自动锁定</p>
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
          <li>• 自动锁定：30秒无操作自动锁屏</li>
          <li>• 登录日志：记录每次访问IP和时间</li>
        </ul>
      </div>

      {/* App Info */}
      <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-[#F2C57C]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">关于心语日记</h3>
        </div>
        <p className="text-xs text-[#9B8A8E] dark:text-[#A89890]">
          心语日记 v1.0 — 你的私密空间，只属于你的日记。记录每一天的心情，守护每一份感受。
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
