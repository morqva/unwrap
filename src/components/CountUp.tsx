import { animate } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface Props {
  value: number
  format: (n: number) => string
  /** Render the final value immediately (used for PNG export) */
  instant?: boolean
  duration?: number
  delay?: number
}

/** Counts from zero with a strong ease-out, so it races up and then settles. */
export function CountUp({ value, format, instant, duration = 2.2, delay = 0.35 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (instant) {
      el.textContent = format(value)
      return
    }
    el.textContent = format(0)
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = format(Math.round(v))),
    })
    return () => controls.stop()
  }, [value, instant, duration, delay, format])
  return <span ref={ref}>{format(instant ? value : 0)}</span>
}
