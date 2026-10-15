'use client'

// PaharPahara — Loading skeleton components.
// Animated shimmer placeholders for use while data is loading.

import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className,
      )}
    />
  )
}

// Stat card skeleton — 4 cards in a row
export function StatCardSkeleton() {
  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center justify-between mb-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
      <Skeleton className="h-7 w-16 mb-1.5" />
      <Skeleton className="h-2.5 w-full" />
    </div>
  )
}

// Dashboard skeleton — full placeholder for the dashboard view while loading
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Banner skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Map + cases skeleton */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-[380px] rounded-lg" />
        <Skeleton className="lg:col-span-1 h-[380px] rounded-lg" />
      </div>

      {/* Sources + jobs skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-[260px] rounded-lg" />
        <Skeleton className="h-[260px] rounded-lg" />
      </div>

      {/* Activity feed + sparklines skeleton */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-[360px] rounded-lg" />
        <Skeleton className="h-[360px] rounded-lg" />
      </div>
    </div>
  )
}

// Case list skeleton — for the Cases view while loading
export function CaseListSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="lg:col-span-2 h-[400px] rounded-lg" />
      </div>
    </div>
  )
}
