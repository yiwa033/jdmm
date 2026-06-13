'use client'

export default function FeedSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-4 animate-pulse">
      {/* Search bar skeleton */}
      <div className="h-10 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded-xl w-full" />

      {/* Date divider skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30" />
        <div className="h-3 w-20 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded" />
        <div className="h-px flex-1 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30" />
      </div>

      {/* Card skeleton 1 */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded-full" />
            <div className="h-3 w-12 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3.5 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded w-full" />
          <div className="h-3.5 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded w-4/5" />
          <div className="h-3.5 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded w-3/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded" />
          <div className="h-3 w-12 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded" />
        </div>
      </div>

      {/* Card skeleton 2 */}
      <div className="bg-white/70 dark:bg-[#2A1F1E]/70 rounded-2xl p-4 border border-[#E8D5DE]/40 dark:border-[#4A3540]/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded-full" />
            <div className="h-3 w-12 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
            <div className="w-6 h-6 bg-[#E8D5DE]/40 dark:bg-[#4A3540]/40 rounded" />
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3.5 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded w-full" />
          <div className="h-3.5 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded w-2/3" />
        </div>
        {/* Image skeleton */}
        <div className="h-40 bg-[#E8D5DE]/20 dark:bg-[#4A3540]/20 rounded-xl mb-3" />
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded" />
          <div className="h-3 w-12 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded" />
          <div className="h-3 w-10 bg-[#E8D5DE]/30 dark:bg-[#4A3540]/30 rounded" />
        </div>
      </div>
    </div>
  )
}
