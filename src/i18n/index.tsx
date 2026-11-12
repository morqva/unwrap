import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './en'
import { ru } from './ru'

export type Lang = 'en' | 'ru'
export type Dict = typeof en

const dicts: Record<Lang, Dict> = { en, ru }

function detect(): Lang {
  try {
    const saved = localStorage.getItem('unwrap.lang')
    if (saved === 'en' || saved === 'ru') return saved
  } catch {
    /* storage may be blocked */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.languages?.[0] || navigator.language : 'en'
  return /^(ru|uk|be|kk)/i.test(nav) ? 'ru' : 'en'
}

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({ lang: 'en', t: en, setLang: () => {} })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const value = useMemo(
    () => ({
      lang,
      t: dicts[lang],
      setLang: (l: Lang) => {
        setLangState(l)
        try {
          localStorage.setItem('unwrap.lang', l)
        } catch {
          /* ignore */
        }
      },
    }),
    [lang],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)

export function formatNumber(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n)
}
