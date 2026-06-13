'use client'

import { X } from 'lucide-react'

interface ImageViewerProps {
  open: boolean
  imageUrl: string
  onClose: () => void
}

export default function ImageViewer({ open, imageUrl, onClose }: ImageViewerProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image */}
      <img
        src={imageUrl}
        alt="日记图片"
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
