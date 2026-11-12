import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CardSpec } from '../cards/buildCards'
import { useI18n } from '../i18n'
import { StoryCard } from './StoryCard'
import { renderPng, shareOrDownload } from './share'

interface Props {
  cards: CardSpec[]
  demo: boolean
  years: number[]
  year: number
  onYear: (y: number) => void
  onClose: () => void
}

const DURATION = 7000

export function Story({ cards, demo, years, year, onYear, onClose }: Props) {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)
  const [exportCard, setExportCard] = useState<CardSpec | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const paused = useRef(false)
  const elapsed = useRef(0)
  const press = useRef<{ x: number; y: number; t: number } | null>(null)

  const card = cards[Math.min(index, cards.length - 1)]
  const last = index >= cards.length - 1

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = Math.max(0, Math.min(cards.length - 1, i + delta))
        if (next !== i) {
          setDir(delta)
          elapsed.current = 0
        }
        return next
      })
    },
    [cards.length],
  )

  // Reset when the card list changes (e.g. switching year)
  useEffect(() => {
    setIndex(0)
    elapsed.current = 0
  }, [cards])

  // Progress bar + auto-advance, driven by rAF without re-rendering React
  useEffect(() => {
    let raf = 0
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = now - prev
      prev = now
      if (!paused.current && !last && !saving) elapsed.current += dt
      const p = last ? 1 : Math.min(1, elapsed.current / DURATION)
      if (barRef.current) barRef.current.style.width = `${p * 100}%`
      if (p >= 1 && !last) go(1)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [index, last, go, saving])

  // Confetti on the hero card, timed with the end of the count-up
  useEffect(() => {
    if (!card.celebrate) return
    const id = setTimeout(() => {
      const colors = [card.theme.accent, ...card.theme.blobs, '#ffffff']
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 }, colors, disableForReducedMotion: true })
      setTimeout(() => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true }), 250)
      setTimeout(() => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true }), 400)
    }, 1600)
    return () => clearTimeout(id)
  }, [card])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // PNG export: render a static copy off-screen, snapshot it, share it.
  useEffect(() => {
    if (!exportCard || !exportRef.current) return
    let cancelled = false
    requestAnimationFrame(async () => {
      try {
        const blob = await renderPng(exportRef.current!)
        if (!cancelled) await shareOrDownload(blob, `unwrap-${year}-${exportCard.id}.png`)
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) {
          setExportCard(null)
          setSaving(false)
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [exportCard, year])

  const onPointerDown = (e: React.PointerEvent) => {
    press.current = { x: e.clientX, y: e.clientY, t: Date.now() }
    paused.current = true
  }
  const onPointerUp = (e: React.PointerEvent) => {
    paused.current = false
    const p = press.current
    press.current = null
    if (!p) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) return go(dx < 0 ? 1 : -1)
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) return onClose()
    if (Date.now() - p.t > 350) return // long press = pause only
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1)
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]">
      {/* 9:16 frame: full screen on phones, centred on desktop */}
      <div
        className="relative h-full w-full overflow-hidden sm:h-[min(100dvh,calc(100vw*16/9))] sm:max-h-[94dvh] sm:w-auto sm:aspect-[9/16] sm:rounded-3xl sm:shadow-2xl"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (paused.current = false)}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={card.id + year}
            custom={dir}
            className="absolute inset-0"
            variants={{
              enter: (d: number) => ({ x: `${d * 35}%`, opacity: 0, scale: 0.94, rotate: d * 2 }),
              center: { x: 0, opacity: 1, scale: 1, rotate: 0 },
              exit: (d: number) => ({ x: `${d * -35}%`, opacity: 0, scale: 0.94, rotate: d * -2 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <StoryCard card={card} demo={demo} bottomSpace={last || (index === 0 && years.length > 1)} />
          </motion.div>
        </AnimatePresence>

        {/* Progress bars */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex gap-1 px-3 pt-[max(12px,env(safe-area-inset-top))]">
          {cards.map((c, i) => (
            <div key={c.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <div ref={i === index ? barRef : undefined} className="h-full rounded-full bg-white" style={{ width: i < index ? '100%' : i > index ? '0%' : undefined }} />
            </div>
          ))}
        </div>

        {/* Top controls */}
        <div className="absolute right-3 top-[max(24px,calc(env(safe-area-inset-top)+16px))] flex gap-2" onPointerDown={stop} onPointerUp={stop}>
          <button
            onClick={() => {
              setSaving(true)
              setExportCard(card)
            }}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-black/50 disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
            </svg>
            {saving ? t.ui.saving : t.ui.share}
          </button>
          <button onClick={onClose} aria-label={t.ui.close} className="grid h-9 w-9 place-items-center rounded-full bg-black/35 backdrop-blur-md transition hover:bg-black/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Year switch on the intro card */}
        {index === 0 && years.length > 1 && (
          <div className="absolute inset-x-0 bottom-[12%] flex flex-wrap justify-center gap-2 px-6" onPointerDown={stop} onPointerUp={stop}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => onYear(y)}
                className={`rounded-full px-4 py-2 font-display text-sm font-bold backdrop-blur-md transition ${y === year ? 'bg-white text-black' : 'bg-black/30 hover:bg-black/45'}`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* Outro actions */}
        {last && (
          <div className="absolute inset-x-0 bottom-[13%] flex flex-col items-center gap-3 px-8" onPointerDown={stop} onPointerUp={stop}>
            <button onClick={() => go(-cards.length)} className="w-full max-w-xs rounded-full bg-white py-3 font-display text-sm font-bold text-black transition hover:scale-[1.02]">
              {t.ui.again}
            </button>
            {demo && (
              <button onClick={onClose} className="w-full max-w-xs rounded-full bg-black/35 py-3 text-sm font-semibold backdrop-blur-md transition hover:bg-black/50">
                {t.ui.own}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Off-screen static copy for PNG export */}
      {exportCard && (
        <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
          <div ref={exportRef} style={{ width: 360, height: 640 }}>
            <StoryCard card={exportCard} instant demo={demo} />
          </div>
        </div>
      )}
    </div>
  )
}
