'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmDialog({ open, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-6">
      <div className="bg-white dark:bg-[#2A1F1E] rounded-3xl p-6 w-full max-w-xs border border-[#E8D5DE]/40 dark:border-[#4A3540]/40 shadow-xl animate-[scaleIn_0.2s_ease-out]">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-[#3D2C2E] dark:text-[#F5E6D3] mb-1">确认删除？</h3>
          <p className="text-sm text-[#9B8A8E] dark:text-[#A89890] mb-5">
            删除后将无法恢复，确定要删除这条日记吗？
          </p>
          <div className="flex gap-3 w-full">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="flex-1 rounded-xl h-10"
            >
              再想想
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-400 hover:bg-red-500 text-white rounded-xl h-10"
            >
              确认删除
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
