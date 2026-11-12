import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Landing } from './components/Landing'
import { Story } from './components/Story'
import { useI18n } from './i18n'
import { availableYears, computeStats, defaultYear } from './core/stats'
import { buildCards } from './cards/buildCards'
import type { NormalizedData } from './core/types'
import type { WorkerOut } from './core/worker'

type Phase = { name: 'landing' } | { name: 'loading'; source?: string } | { name: 'error'; message: string } | { name: 'story' }

export default function App() {
  const { t, lang } = useI18n()
  const [phase, setPhase] = useState<Phase>({ name: 'landing' })
  const [data, setData] = useState<NormalizedData[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [demo, setDemo] = useState(false)

  const finish = useCallback(
    (result: NormalizedData[], isDemo: boolean) => {
      if (!result.length) return setPhase({ name: 'error', message: t.errors.nothing })
      setData(result)
      setYear(defaultYear(result))
      setDemo(isDemo)
      setPhase({ name: 'story' })
    },
    [t],
  )

  const onFiles = useCallback(
    (files: File[]) => {
      setPhase({ name: 'loading' })
      const worker = new Worker(new URL('./core/worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<WorkerOut>) => {
        const msg = e.data
        if (msg.type === 'progress') setPhase({ name: 'loading', source: msg.source })
        else {
          worker.terminate()
          if (msg.type === 'done') finish(msg.data, false)
          else setPhase({ name: 'error', message: t.errors.failed(msg.message) })
        }
      }
      worker.onerror = (e) => {
        worker.terminate()
        setPhase({ name: 'error', message: t.errors.failed(e.message) })
      }
      worker.postMessage({ files })
    },
    [finish, t],
  )

  const onDemo = useCallback(async () => {
    setPhase({ name: 'loading' })
    // Lazy-loaded so the fake-data generator isn't in the main bundle
    const [{ generateDemo }, { parseAll }] = await Promise.all([import('./demo/generate'), import('./parsers')])
    await new Promise((r) => setTimeout(r, 50))
    finish(await parseAll(generateDemo(lang)), true)
  }, [finish, lang])

  const years = useMemo(() => availableYears(data), [data])
  const cards = useMemo(() => (data.length ? buildCards(computeStats(data, year), t) : []), [data, year, t])

  return (
    <>
      <Landing onFiles={onFiles} onDemo={onDemo} />

      {phase.name === 'loading' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#09090f]/95 px-6 text-center backdrop-blur">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#ff3d8b,#ff9f1c,#c6f432,#4cc9f0,#7c3aed,#ff3d8b)', animation: 'spin-slow 1.2s linear infinite' }} />
            <div className="absolute inset-[6px] rounded-full bg-[#09090f]" />
          </div>
          <motion.div key={phase.source} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl font-bold">
            {phase.source ? t.loading.source(phase.source) : t.loading.reading}
          </motion.div>
          <p className="max-w-xs text-sm text-white/60">🔒 {t.loading.note}</p>
        </div>
      )}

      {phase.name === 'error' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#09090f]/95 px-6 text-center backdrop-blur">
          <div className="text-5xl">🫠</div>
          <p className="max-w-md text-white/80">{phase.message}</p>
          <button onClick={() => setPhase({ name: 'landing' })} className="rounded-full bg-white px-6 py-3 font-display text-sm font-bold text-black">
            {t.errors.back}
          </button>
        </div>
      )}

      {phase.name === 'story' && cards.length > 0 && (
        <Story cards={cards} demo={demo} years={years} year={year} onYear={setYear} onClose={() => setPhase({ name: 'landing' })} />
      )}
    </>
  )
}
