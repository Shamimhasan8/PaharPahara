'use client'

// Before/After satellite comparison slider with drag handle.

import { useRef, useState, useCallback, useEffect } from 'react'

interface Props {
  beforeSrc: string
  afterSrc: string
  beforeLabel: string
  afterLabel: string
  height?: number
  hint?: string
}

export function BeforeAfterSlider({ beforeSrc, afterSrc, beforeLabel, afterLabel, height = 360, hint }: Props) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPos(pct)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      updateFromClientX(clientX)
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [updateFromClientX])

  return (
    <div
      ref={ref}
      className="relative w-full rounded-lg overflow-hidden border border-border bg-card select-none"
      style={{ height }}
      onMouseDown={(e) => {
        dragging.current = true
        updateFromClientX(e.clientX)
      }}
      onTouchStart={(e) => {
        dragging.current = true
        updateFromClientX(e.touches[0].clientX)
      }}
    >
      {/* After image (full width, bottom layer) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      {/* Before image clipped to left portion */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${pos}%` }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${(100 / pos) * 100}%`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-card/80 backdrop-blur text-[10px] font-medium border border-border">
        {beforeLabel}
      </div>
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-card/80 backdrop-blur text-[10px] font-medium border border-border">
        {afterLabel}
      </div>

      {/* Hint */}
      {hint && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-card/80 backdrop-blur text-[10px] text-muted-foreground border border-border">
          {hint}
        </div>
      )}

      {/* Drag handle */}
      <div
        className="absolute top-0 bottom-0 compare-handle pointer-events-none"
        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_0_1px_rgba(255,255,255,0.6)]" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center pointer-events-auto cursor-ew-resize">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 7 L4 12 L9 17 M15 7 L20 12 L15 17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
