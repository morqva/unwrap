import { motion } from 'framer-motion'
import { useCallback, type CSSProperties } from 'react'
import type { CardSpec } from '../cards/buildCards'
import { formatNumber, useI18n } from '../i18n'
import { SITE_LABEL } from '../config'
import { CountUp } from './CountUp'

interface Props {
  card: CardSpec
  /** No animations, final values — used for PNG export */
  instant?: boolean
  demo?: boolean
  /** Leave room at the bottom for overlay buttons */
  bottomSpace?: boolean
}

const EASE = [0.16, 1, 0.3, 1] as const
const pad = (h: number) => `${String(h).padStart(2, '0')}:00`

/** All sizes are in container units (cqw) so the card looks identical on a phone and in the 1080×1920 export. */
export function StoryCard({ card, instant, demo, bottomSpace }: Props) {
  const { t, lang } = useI18n()
  const fmt = useCallback((n: number) => formatNumber(n, lang) + (card.value.kind === 'number' && card.value.suffix ? card.value.suffix : ''), [lang, card.value])
  const fmtHour = useCallback((h: number) => pad(h), [])

  const enter = (i: number) =>
    instant
      ? {}
      : {
          initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { delay: 0.1 + i * 0.13, duration: 0.7, ease: EASE },
        }

  const v = card.value
  const display =
    v.kind === 'number' ? fmt(v.value) : v.kind === 'hour' ? pad(v.value) : v.value
  // Unbounded is wide (~0.9em per glyph); size so the longest word fits in the 84cqw content width.
  const longest = Math.max(1, ...display.split(/\s+/).map((w) => [...w].length))
  const total = [...display].length
  const valueSize =
    v.kind === 'emoji'
      ? 42
      : v.kind === 'text'
        ? Math.max(8, Math.min(18, 88 / longest, total > 14 ? 150 / total : 18))
        : Math.max(10, Math.min(24, 88 / total))

  const blob = (color: string, style: CSSProperties) => (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: '95cqw',
        height: '95cqw',
        background: `radial-gradient(circle, ${color}cc 0%, ${color}00 68%)`,
        animation: instant ? undefined : 'float 9s ease-in-out infinite',
        ...style,
      }}
    />
  )

  return (
    <div className="card-frame relative h-full w-full overflow-hidden text-white select-none" style={{ background: card.theme.bg }}>
      {blob(card.theme.blobs[0], { top: '-30cqw', right: '-40cqw' })}
      {blob(card.theme.blobs[1], { bottom: '-35cqw', left: '-45cqw', animationDelay: '-4s' })}

      <div className="absolute inset-0 flex flex-col" style={{ padding: '24cqw 8cqw 7cqw' }}>
        <motion.div {...enter(0)} className="font-display font-semibold uppercase" style={{ fontSize: '3.4cqw', letterSpacing: '0.14em', opacity: 0.85 }}>
          {card.kicker}
        </motion.div>

        <div className="flex flex-1 flex-col justify-center" style={{ gap: '3.5cqw', paddingBottom: bottomSpace ? '36cqw' : 0 }}>
          {card.title && (
            <motion.div {...enter(1)} className="font-display font-bold" style={{ fontSize: '7cqw', lineHeight: 1.1 }}>
              {card.title}
            </motion.div>
          )}

          <motion.div
            {...(instant
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.7 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { delay: 0.25, type: 'spring', stiffness: 160, damping: 14 },
                })}
            className="font-display font-extrabold"
            style={{
              fontSize: `${valueSize}cqw`,
              lineHeight: 1.02,
              letterSpacing: v.kind === 'emoji' ? 0 : '-0.03em',
              color: v.kind === 'emoji' ? undefined : card.theme.accent,
              overflowWrap: 'break-word',
              whiteSpace: v.kind === 'text' ? 'normal' : 'nowrap',
              textShadow: v.kind === 'emoji' ? '0 2cqw 6cqw rgba(0,0,0,.35)' : `0 0 8cqw ${card.theme.accent}55`,
              transformOrigin: 'left center',
            }}
          >
            {v.kind === 'number' ? (
              <CountUp value={v.value} format={fmt} instant={instant} />
            ) : v.kind === 'hour' ? (
              <CountUp value={v.value} format={fmtHour} instant={instant} duration={1.6} />
            ) : (
              display
            )}
          </motion.div>

          <motion.p {...enter(3)} style={{ fontSize: '4.7cqw', lineHeight: 1.35, maxWidth: '78cqw', opacity: 0.95 }}>
            {card.caption}
          </motion.p>

          {card.note && (
            <motion.p {...enter(4)} style={{ fontSize: '3.4cqw', opacity: 0.65 }}>
              {card.note}
            </motion.p>
          )}

          {card.chips && card.chips.length > 0 && (
            <motion.div {...enter(4)} className="flex flex-wrap" style={{ gap: '2cqw' }}>
              {card.chips.map((c) => (
                <span key={c} className="rounded-full bg-white/12 font-semibold" style={{ padding: '1.6cqw 3.6cqw', fontSize: '3.8cqw', background: 'rgba(255,255,255,.13)' }}>
                  {c}
                </span>
              ))}
            </motion.div>
          )}

          {card.chart && (
            <div className="flex items-end" style={{ height: '18cqw', gap: '0.8cqw', marginTop: '2cqw' }}>
              {card.chart.data.map((n, i) => {
                const max = Math.max(...card.chart!.data, 1)
                const hi = i === card.chart!.highlight
                return (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{ height: `${Math.max(4, (n / max) * 100)}%`, background: hi ? card.theme.accent : 'rgba(255,255,255,.28)', transformOrigin: 'bottom' }}
                    {...(instant ? {} : { initial: { scaleY: 0 }, animate: { scaleY: 1 }, transition: { delay: 0.5 + i * 0.025, duration: 0.6, ease: EASE } })}
                  />
                )
              })}
            </div>
          )}

          {card.list && card.list.length > 0 && (
            <div className="flex flex-col" style={{ gap: '2.2cqw', marginTop: '1cqw' }}>
              {card.list.map((row, i) => (
                <motion.div key={row.label + i} {...enter(4 + i * 0.6)} className="flex items-baseline" style={{ gap: '3cqw', fontSize: '4.2cqw' }}>
                  <span className="font-display font-bold" style={{ width: '5cqw', opacity: 0.55, fontSize: '3.4cqw' }}>
                    {card.id === 'outro' || card.id === 'follows' ? '•' : i + (card.id === 'chats' ? 1 : 2)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{row.label}</span>
                  <span className="font-display font-bold" style={{ color: card.theme.accent }}>
                    {row.value}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end justify-between whitespace-nowrap" style={{ gap: '3cqw', opacity: 0.8 }}>
          <div className="min-w-0">
            <div className="font-display font-extrabold" style={{ fontSize: '4.2cqw' }}>
              unwrap<span style={{ color: card.theme.accent }}>.</span>
            </div>
            <div className="truncate" style={{ fontSize: '2.9cqw', opacity: 0.75 }}>
              {SITE_LABEL}
            </div>
          </div>
          <span className="rounded-full" style={{ fontSize: '2.8cqw', padding: '1cqw 2.6cqw', background: 'rgba(0,0,0,.25)' }}>
            {demo ? t.ui.demoBadge : t.ui.onDevice}
          </span>
        </div>
      </div>
    </div>
  )
}
