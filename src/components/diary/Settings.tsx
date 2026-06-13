'use client'

import { useState } from 'react'
import { ShieldCheck, Lock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { hashPin, generateSalt, hexToBytes, deriveKey } from '@/lib/crypto'

interface SettingsProps {
  onLock: () => void
}

export default function Settings({ onLock }: SettingsProps) {
  const [changingPin, setChangingPin] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChangePin = async () => {
    setError('')
    setMessage('')

    if (!/^\d{4}$/.test(newPin)) {
      setError('新密码必须是4位数字')
      return
    }
    if (newPin !== confirmPin) {
      setError('两次输入不一致')
      return
    }

    try {
      const oldHash = await hashPin(oldPin)
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: oldHash }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.valid) {
        setError('旧密码错误')
        return
      }

      // Delete old password and create new one
      const newSalt = generateSalt()
      const newHash = await hashPin(newPin)

      // Use setup API after deleting - we'll just call setup
      // First delete via a direct approach
      const setupRes = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newHash, salt: newSalt }),
      })

      if (setupRes.ok) {
        setMessage('密码修改成功！请重新解锁')
        setChangingPin(false)
        setOldPin('')
        setNewPin('')
        setConfirmPin('')
        // Lock the app so user needs to re-enter
        setTimeout(() => onLock(), 1500)
      } else {
        setError('修改失败，请重试')
      }
    } catch {
      setError('修改失败，请重试')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-4">
      <h2 className="text-lg font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">设置</h2>

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
          <p className="text-xs text-[#9B8A8E]">立即锁定，需要重新输入密码</p>
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
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="输入旧密码"
            value={oldPin}
            onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
            className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl"
          />
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="输入新密码"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl"
          />
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="确认新密码"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className="bg-white/60 dark:bg-[#1A1614]/60 border-[#E8D5DE]/40 dark:border-[#4A3540]/40 rounded-xl"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setChangingPin(false)
                setError('')
              }}
              variant="ghost"
              className="flex-1 rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleChangePin}
              className="flex-1 bg-gradient-to-r from-[#E8A0BF] to-[#F2C57C] text-white rounded-xl"
            >
              确认修改
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      {message && <p className="text-sm text-green-400 text-center">{message}</p>}

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
          <li>• 服务器只存储加密后的数据</li>
          <li>• 即使数据库泄露，也无法读取内容</li>
        </ul>
      </div>

      {/* App Info */}
      <div className="p-4 bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-[#F2C57C]" />
          <h3 className="text-sm font-semibold text-[#3D2C2E] dark:text-[#F5E6D3]">关于心语日记</h3>
        </div>
        <p className="text-xs text-[#9B8A8E] dark:text-[#A89890]">
          心语日记 v1.0 — 你的私密空间，只属于你的日记。
          <br />
          记录每一天的心情，守护每一份感受。
        </p>
      </div>
    </div>
  )
}
