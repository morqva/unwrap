import type { Stats } from '../core/stats'
import type { Dict } from '../i18n'

export interface Theme {
  /** Main background gradient */
  bg: string
  /** Accent used for the big number */
  accent: string
  /** Colours of the floating blobs */
  blobs: [string, string]
}

export const THEMES: Theme[] = [
  { bg: 'linear-gradient(160deg,#1a0b2e 0%,#3b0d5c 55%,#ff3d8b 130%)', accent: '#ff7ab6', blobs: ['#ff3d8b', '#7c3aed'] },
  { bg: 'linear-gradient(160deg,#04141f 0%,#073b4c 55%,#06d6a0 130%)', accent: '#5ef2c6', blobs: ['#06d6a0', '#118ab2'] },
  { bg: 'linear-gradient(160deg,#1f0a00 0%,#5c1d00 55%,#ff9f1c 130%)', accent: '#ffc15e', blobs: ['#ff9f1c', '#ff4d00'] },
  { bg: 'linear-gradient(160deg,#050a24 0%,#13207a 55%,#4cc9f0 130%)', accent: '#8be0ff', blobs: ['#4cc9f0', '#4361ee'] },
  { bg: 'linear-gradient(160deg,#1e0010 0%,#6a0136 55%,#ff5d73 130%)', accent: '#ff9aa8', blobs: ['#ff5d73', '#c9184a'] },
  { bg: 'linear-gradient(160deg,#0b1a05 0%,#2d5a0b 55%,#c6f432 130%)', accent: '#dcff6e', blobs: ['#c6f432', '#38b000'] },
  { bg: 'linear-gradient(160deg,#12002b 0%,#2f0080 55%,#b388ff 130%)', accent: '#d0b8ff', blobs: ['#b388ff', '#651fff'] },
  { bg: 'linear-gradient(160deg,#201400 0%,#4d3500 55%,#ffd60a 130%)', accent: '#ffe566', blobs: ['#ffd60a', '#ff8800'] },
]

export type CardValue =
  | { kind: 'number'; value: number; suffix?: string }
  | { kind: 'text'; value: string }
  | { kind: 'emoji'; value: string }
  | { kind: 'hour'; value: number }

export interface CardSpec {
  id: string
  theme: Theme
  kicker: string
  /** Optional line above the value (e.g. a title) */
  title?: string
  value: CardValue
  caption: string
  /** Small print under the caption */
  note?: string
  list?: { label: string; value: string }[]
  chart?: { data: number[]; highlight: number }
  chips?: string[]
  celebrate?: boolean
}

export function buildCards(s: Stats, t: Dict): CardSpec[] {
  const c = t.cards
  const cards: Omit<CardSpec, 'theme'>[] = []
  const num = (value: number, suffix?: string): CardValue => ({ kind: 'number', value, suffix })
  const fmt = (n: number) => new Intl.NumberFormat(t.locale).format(n)
  const q = (s: string) => (t.locale.startsWith('ru') ? `«${s}»` : `“${s}”`)

  cards.push({
    id: 'intro',
    kicker: c.introKicker(s.year),
    title: c.introTitle(s.ownerName),
    value: { kind: 'text', value: String(s.year) },
    caption: c.introCaption(s.year),
    chips: s.sources.map((x) => t.sources[x]),
  })

  const m = s.messages
  if (m && m.sent > 0) {
    cards.push({ id: 'sent', kicker: c.sentKicker, value: num(m.sent), caption: c.sentCaption(m.wordsSent) })

    if (m.closest) {
      cards.push({ id: 'closest', kicker: c.closestKicker, value: { kind: 'text', value: m.closest.name }, caption: c.closestCaption(m.closest.total) })
    }
    if (m.topChats.length >= 3) {
      cards.push({
        id: 'chats',
        kicker: c.chatsKicker,
        value: num(m.activeChats),
        caption: c.chatsCaption(m.activeChats),
        list: m.topChats.map((x) => ({ label: x.name, value: fmt(x.total) })),
      })
    }
    if (m.topWords[0]) {
      cards.push({
        id: 'word',
        kicker: c.wordKicker,
        value: { kind: 'text', value: q(m.topWords[0].word) },
        caption: c.wordCaption(m.topWords[0].count),
        list: m.topWords.slice(1, 5).map((w) => ({ label: w.word, value: fmt(w.count) })),
      })
    }
    if (m.topEmoji[0]) {
      cards.push({
        id: 'emoji',
        kicker: c.emojiKicker,
        value: { kind: 'emoji', value: m.topEmoji[0].emoji },
        caption: c.emojiCaption(m.topEmoji[0].count),
        chips: m.topEmoji.slice(1, 5).map((e) => `${e.emoji} ${fmt(e.count)}`),
      })
    }
    cards.push({
      id: 'hour',
      kicker: c.hourKicker,
      title: c.hourTitle(m.activity.peakHour),
      value: { kind: 'hour', value: m.activity.peakHour },
      caption: c.hourCaption(m.activity.peakHour, t.weekdays[m.activity.peakWeekday]),
      chart: { data: m.activity.hours, highlight: m.activity.peakHour },
    })
    if (m.fastest[0]) {
      cards.push({
        id: 'fast',
        kicker: c.fastKicker,
        value: { kind: 'text', value: m.fastest[0].name },
        caption: c.fastCaption(m.fastest[0].name, t.duration(m.fastest[0].seconds)),
        note: m.myReplySeconds ? c.fastMine(t.duration(m.myReplySeconds)) : undefined,
        list: m.fastest.slice(1, 4).map((x) => ({ label: x.name, value: t.duration(x.seconds) })),
      })
    }
    if (m.busiestDay && m.busiestDay.count >= 30) {
      cards.push({ id: 'busy', kicker: c.busyDayKicker, value: num(m.busiestDay.count), caption: c.busyDayCaption(t.date(m.busiestDay.date)) })
    }
  }

  const v = s.videos
  if (v) {
    cards.push({
      id: 'videos',
      kicker: c.videosKicker,
      value: num(v.watched),
      caption: c.videosCaption(t.duration(v.seconds)),
      note: c.videosNote,
    })
    if (v.bingeDay && v.bingeDay.count >= 50) {
      cards.push({ id: 'binge', kicker: c.bingeKicker, value: num(v.bingeDay.count), caption: c.bingeCaption(t.date(v.bingeDay.date)) })
    }
    cards.push({
      id: 'scroll',
      kicker: c.scrollKicker,
      value: { kind: 'hour', value: v.activity.peakHour },
      caption: c.scrollCaption(t.weekdays[v.activity.peakWeekday]),
      chart: { data: v.activity.hours, highlight: v.activity.peakHour },
    })
  }

  if (s.likes) {
    cards.push({
      id: 'likes',
      kicker: c.likesKicker,
      value: num(s.likes.given),
      caption: c.likesCaption,
      note: s.likes.topTarget ? c.likesTop(s.likes.topTarget.name, s.likes.topTarget.count) : undefined,
    })
  }

  const f = s.follows
  if (f && (f.flings.length || f.unfollowed)) {
    const names = (f.flings.length ? f.flings : f.unfollowedNames).slice(0, 3)
    cards.push({
      id: 'follows',
      kicker: c.followsKicker,
      value: num(f.flings.length || f.unfollowed),
      caption: c.followsCaption(f.followed),
      list: names.map((n) => ({ label: '@' + n.replace(/^@/, ''), value: '💔' })),
    })
  }

  if (s.searches?.top[0] && s.searches.top[0].count >= 2) {
    cards.push({
      id: 'search',
      kicker: c.searchKicker,
      value: { kind: 'text', value: q(s.searches.top[0].term) },
      caption: c.searchCaption(s.searches.top[0].count),
    })
  }

  // Outro with a recap grid
  const recap: { label: string; value: string }[] = []
  if (m) recap.push({ label: c.sentKicker, value: fmt(m.sent) })
  if (m?.closest) recap.push({ label: c.closestKicker, value: m.closest.name })
  if (m?.topWords[0]) recap.push({ label: c.wordKicker, value: m.topWords[0].word })
  if (m?.topEmoji[0]) recap.push({ label: c.emojiKicker, value: m.topEmoji[0].emoji })
  if (v) recap.push({ label: c.videosKicker, value: fmt(v.watched) })
  if (s.likes) recap.push({ label: c.likesKicker, value: fmt(s.likes.given) })
  cards.push({
    id: 'outro',
    kicker: c.outroKicker(s.year),
    value: { kind: 'text', value: c.outroTitle },
    caption: c.outroCaption,
    list: recap.slice(0, 6),
  })

  // Confetti on the most impressive number
  const hero = cards.find((x) => x.id === 'sent') ?? cards.find((x) => x.id === 'videos') ?? cards.find((x) => x.id === 'likes')
  if (hero) hero.celebrate = true

  return cards.map((card, i) => ({ ...card, theme: THEMES[i % THEMES.length] }))
}
