import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useI18n, type Lang } from '../i18n'
import { REPO_URL } from '../config'
import type { SourceId } from '../core/types'

interface Props {
  onFiles: (files: File[]) => void
  onDemo: () => void
}

const SOURCE_COLORS: Record<SourceId, string> = {
  telegram: 'from-sky-400 to-blue-600',
  instagram: 'from-pink-500 via-fuchsia-500 to-amber-400',
  tiktok: 'from-cyan-300 via-zinc-800 to-rose-500',
}

export function Landing({ onFiles, onDemo }: Props) {
  const { t, lang, setLang } = useI18n()
  const L = t.landing
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // Accept drops anywhere on the page
  useEffect(() => {
    let depth = 0
    const enter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      depth++
      setDragging(true)
    }
    const leave = () => {
      depth = Math.max(0, depth - 1)
      if (!depth) setDragging(false)
    }
    const over = (e: DragEvent) => e.preventDefault()
    const drop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDragging(false)
      const files = [...(e.dataTransfer?.files ?? [])]
      if (files.length) onFiles(files)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [onFiles])

  const fade = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.05 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/30 blur-[120px]" style={{ animation: 'float 14s ease-in-out infinite' }} />
        <div className="absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-orange-500/20 blur-[120px]" style={{ animation: 'float 16s ease-in-out infinite', animationDelay: '-5s' }} />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[120px]" style={{ animation: 'float 18s ease-in-out infinite', animationDelay: '-9s' }} />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <header className="flex items-center justify-between py-5">
          <span className="font-display text-lg font-extrabold tracking-tight">
            unwrap<span className="text-pink-500">.</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-white/8 p-1 text-xs font-bold" style={{ background: 'rgba(255,255,255,.08)' }}>
              {(['en', 'ru'] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1.5 uppercase transition ${lang === l ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
            <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="GitHub" className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
              </svg>
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="pb-10 pt-8 text-center sm:pt-16">
          <motion.div {...fade(0)} className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
            {L.badge}
          </motion.div>
          <motion.h1 {...fade(1)} className="mt-6 font-display text-[13vw] font-extrabold leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
            {L.title1}
            <br />
            <span className="text-gradient">{L.title2}</span>
          </motion.h1>
          <motion.p {...fade(2)} className="mx-auto mt-6 max-w-xl text-base text-white/70 sm:text-lg">
            {L.subtitle}
          </motion.p>

          <motion.div {...fade(3)} className="mt-6 flex justify-center gap-2">
            {(Object.keys(SOURCE_COLORS) as SourceId[]).map((s) => (
              <span key={s} className={`rounded-full bg-gradient-to-r ${SOURCE_COLORS[s]} p-[1.5px]`}>
                <span className="block rounded-full bg-[#09090f] px-3 py-1 text-xs font-bold">{t.sources[s]}</span>
              </span>
            ))}
          </motion.div>
        </section>

        {/* Drop zone */}
        <motion.section {...fade(4)}>
          <div
            onClick={() => input.current?.click()}
            className={`group relative mx-auto max-w-2xl cursor-pointer rounded-[2rem] p-[2px] transition ${dragging ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            style={{ background: 'linear-gradient(120deg,#ff3d8b,#ff9f1c,#c6f432,#4cc9f0,#7c3aed)' }}
          >
            <div className="flex flex-col items-center gap-4 rounded-[calc(2rem-2px)] bg-[#0d0d16]/95 px-6 py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-3xl transition group-hover:-translate-y-1">{dragging ? '🎁' : '📦'}</div>
              <div className="font-display text-xl font-bold sm:text-2xl">{dragging ? L.dropping : L.drop}</div>
              <p className="max-w-md text-sm text-white/60">{L.dropHint}</p>
              <span className="mt-1 rounded-full bg-white px-6 py-3 font-display text-sm font-bold text-black">{L.choose}</span>
            </div>
            <input
              ref={input}
              type="file"
              multiple
              accept=".json,.zip,application/json,application/zip"
              className="hidden"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ''
                if (files.length) onFiles(files)
              }}
            />
          </div>
          <div className="mt-5 text-center">
            <button onClick={onDemo} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-white/50 hover:bg-white/5">
              ✨ {L.demo}
            </button>
          </div>
        </motion.section>

        {/* Privacy */}
        <section className="mt-24">
          <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">
            🔒 <span className="text-gradient">{L.privacyTitle}</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {L.privacy.map(([title, text], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="font-display text-lg font-bold">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-sm font-semibold text-pink-400 underline-offset-4 hover:underline">
              {L.readCode} →
            </a>
          </div>
        </section>

        {/* How to export */}
        <section className="mt-24">
          <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">{L.howTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60">{L.howNote}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(Object.keys(L.how) as SourceId[]).map((s) => (
              <div key={s} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className={`inline-block rounded-full bg-gradient-to-r ${SOURCE_COLORS[s]} px-3 py-1 text-xs font-extrabold`}>{t.sources[s]}</div>
                <ol className="mt-4 space-y-3 text-sm text-white/75">
                  {L.how[s].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-display text-xs font-bold text-white/40">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 flex flex-col items-center gap-2 pb-10 text-center text-xs text-white/40">
          <span>{L.footer}</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-white/70">
            MIT · GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}
