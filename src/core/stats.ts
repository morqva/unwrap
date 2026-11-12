import type { Message, NormalizedData, SourceId } from './types'
import { countEmoji, countWords, topN } from './text'

/** Average short video length used to estimate watch time (TikTok doesn't export durations). */
export const AVG_VIDEO_SECONDS = 25
/** Replies slower than this aren't "replies", they're new conversations. */
const MAX_REPLY_MS = 12 * 3600_000
const MIN_REPLIES = 5

export interface Activity {
  hours: number[]
  weekdays: number[] // 0 = Monday
  peakHour: number
  peakWeekday: number
}

export interface Stats {
  year: number
  sources: SourceId[]
  ownerName?: string
  messages?: {
    sent: number
    received: number
    wordsSent: number
    activeChats: number
    topChats: { name: string; sent: number; received: number; total: number; type: Message['chatType'] }[]
    closest?: { name: string; total: number; source: SourceId }
    topWords: { word: string; count: number }[]
    topEmoji: { emoji: string; count: number }[]
    activity: Activity
    busiestDay?: { date: number; count: number }
    /** People who answer you the fastest (median seconds) */
    fastest: { name: string; seconds: number }[]
    myReplySeconds?: number
  }
  videos?: {
    watched: number
    seconds: number
    activity: Activity
    bingeDay?: { date: number; count: number }
  }
  likes?: { given: number; topTarget?: { name: string; count: number } }
  comments?: { count: number }
  follows?: { followed: number; unfollowed: number; unfollowedNames: string[]; flings: string[] }
  searches?: { total: number; top: { term: string; count: number }[] }
}

const inYear = (year: number) => (ts: number) => new Date(ts).getFullYear() === year

function yearCounts(data: NormalizedData[]): Map<number, number> {
  const counts = new Map<number, number>()
  const add = (ts: number) => {
    const y = new Date(ts).getFullYear()
    counts.set(y, (counts.get(y) ?? 0) + 1)
  }
  for (const d of data) {
    for (const m of d.messages) add(m.ts)
    for (const list of [d.views, d.likes, d.comments, d.follows, d.unfollows, d.searches]) for (const e of list) add(e.ts)
  }
  return counts
}

/**
 * Years that actually have data in the export, newest first. An export from 2022 gives
 * 2022…2026; a one-year export gives just that year. Years with only a few stray events
 * (an old follow, a timezone edge) are dropped, so they don't show up as empty stories.
 */
export function availableYears(data: NormalizedData[]): number[] {
  const counts = yearCounts(data)
  const max = Math.max(0, ...counts.values())
  return [...counts.entries()]
    .filter(([, n]) => n >= 50 || n >= max * 0.05)
    .map(([y]) => y)
    .sort((a, b) => b - a)
}

/** The latest year that has a meaningful amount of data. */
export function defaultYear(data: NormalizedData[]): number {
  const counts = yearCounts(data)
  const years = availableYears(data)
  if (!years.length) return new Date().getFullYear()
  const max = Math.max(...years.map((y) => counts.get(y)!))
  return years.find((y) => counts.get(y)! >= max * 0.15) ?? years[0]
}

function activity(timestamps: number[]): Activity {
  const hours = new Array(24).fill(0)
  const weekdays = new Array(7).fill(0)
  for (const ts of timestamps) {
    const d = new Date(ts)
    hours[d.getHours()]++
    weekdays[(d.getDay() + 6) % 7]++
  }
  return { hours, weekdays, peakHour: argmax(hours), peakWeekday: argmax(weekdays) }
}

function argmax(arr: number[]) {
  let best = 0
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i
  return best
}

function busiest(timestamps: number[]) {
  const days = new Map<number, number>()
  for (const ts of timestamps) {
    const d = new Date(ts)
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    days.set(key, (days.get(key) ?? 0) + 1)
  }
  const [best] = topN(days, 1)
  return best ? { date: best[0], count: best[1] } : undefined
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** For each personal chat: how quickly the other person replies to me, and how quickly I reply. */
function replyTimes(messages: Message[]) {
  const byChat = new Map<string, Message[]>()
  for (const m of messages) {
    if (m.chatType !== 'personal') continue
    let list = byChat.get(m.chat)
    if (!list) byChat.set(m.chat, (list = []))
    list.push(m)
  }
  const theirs: { name: string; seconds: number }[] = []
  const mine: number[] = []
  for (const [chat, list] of byChat) {
    list.sort((a, b) => a.ts - b.ts)
    const replies: number[] = []
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]
      const cur = list[i]
      if (prev.fromMe === cur.fromMe) continue
      const delta = cur.ts - prev.ts
      if (delta < 0 || delta > MAX_REPLY_MS) continue
      if (cur.fromMe) mine.push(delta)
      else replies.push(delta)
    }
    if (replies.length >= MIN_REPLIES) theirs.push({ name: chat, seconds: median(replies) / 1000 })
  }
  theirs.sort((a, b) => a.seconds - b.seconds)
  return { fastest: theirs.slice(0, 5), mine: mine.length >= MIN_REPLIES ? median(mine) / 1000 : undefined }
}

export function computeStats(data: NormalizedData[], year: number): Stats {
  const f = inYear(year)
  const stats: Stats = {
    year,
    sources: data.map((d) => d.source),
    // Prefer real names (Telegram, Instagram) over TikTok usernames
    ownerName: (['telegram', 'instagram', 'tiktok'] as SourceId[])
      .map((s) => data.find((d) => d.source === s)?.ownerName)
      .find(Boolean),
  }

  // ---- Messages -----------------------------------------------------------
  const msgs = data.flatMap((d) => d.messages.filter((m) => f(m.ts)).map((m) => ({ m, source: d.source })))
  if (msgs.length) {
    const words = new Map<string, number>()
    const emoji = new Map<string, number>()
    const chats = new Map<string, { name: string; sent: number; received: number; total: number; type: Message['chatType']; source: SourceId }>()
    let sent = 0
    let wordsSent = 0
    const myTimes: number[] = []
    for (const { m, source } of msgs) {
      const key = `${source}:${m.chat}`
      let c = chats.get(key)
      if (!c) chats.set(key, (c = { name: m.chat, sent: 0, received: 0, total: 0, type: m.chatType, source }))
      c.total++
      if (m.fromMe) {
        c.sent++
        sent++
        myTimes.push(m.ts)
        if (m.text) {
          wordsSent += countWords(m.text, words)
          countEmoji(m.text, emoji)
        }
      } else c.received++
    }
    const chatList = [...chats.values()].filter((c) => c.type !== 'channel' || c.sent > 0)
    chatList.sort((a, b) => b.total - a.total)
    const closest = chatList.find((c) => c.type === 'personal' && c.sent > 0)
    const replies = replyTimes(msgs.map((x) => x.m))
    stats.messages = {
      sent,
      received: msgs.length - sent,
      wordsSent,
      activeChats: chatList.filter((c) => c.sent > 0).length,
      topChats: chatList.slice(0, 5).map(({ source: _s, ...c }) => c),
      closest: closest && { name: closest.name, total: closest.total, source: closest.source },
      topWords: topN(words, 5).map(([word, count]) => ({ word, count })),
      topEmoji: topN(emoji, 5).map(([emoji, count]) => ({ emoji, count })),
      activity: activity(myTimes.length ? myTimes : msgs.map((x) => x.m.ts)),
      busiestDay: busiest(myTimes),
      fastest: replies.fastest,
      myReplySeconds: replies.mine,
    }
  }

  // ---- Videos -------------------------------------------------------------
  const views = data.flatMap((d) => d.views.filter((e) => f(e.ts)).map((e) => e.ts))
  if (views.length) {
    stats.videos = {
      watched: views.length,
      seconds: views.length * AVG_VIDEO_SECONDS,
      activity: activity(views),
      bingeDay: busiest(views),
    }
  }

  // ---- Likes --------------------------------------------------------------
  const likes = data.flatMap((d) => d.likes.filter((e) => f(e.ts)))
  if (likes.length) {
    const targets = new Map<string, number>()
    for (const l of likes) if (l.target && !/^https?:/.test(l.target)) targets.set(l.target, (targets.get(l.target) ?? 0) + 1)
    const [top] = topN(targets, 1)
    stats.likes = { given: likes.length, topTarget: top && top[1] > 2 ? { name: top[0], count: top[1] } : undefined }
  }

  const comments = data.flatMap((d) => d.comments.filter((e) => f(e.ts)))
  if (comments.length) stats.comments = { count: comments.length }

  // ---- Follows ------------------------------------------------------------
  const follows = data.flatMap((d) => d.follows.filter((e) => f(e.ts)))
  const unfollows = data.flatMap((d) => d.unfollows.filter((e) => f(e.ts)))
  if (follows.length || unfollows.length) {
    const followedAt = new Map(follows.map((x) => [x.user, x.ts]))
    // "Flings": followed this year and unfollowed later the same year
    const flings = unfollows.filter((u) => (followedAt.get(u.user) ?? Infinity) <= u.ts).map((u) => u.user)
    stats.follows = {
      followed: follows.length,
      unfollowed: unfollows.length,
      unfollowedNames: unfollows.slice(0, 3).map((u) => u.user),
      flings,
    }
  }

  // ---- Searches -----------------------------------------------------------
  const searches = data.flatMap((d) => d.searches.filter((e) => f(e.ts)))
  if (searches.length) {
    const terms = new Map<string, number>()
    for (const s of searches) {
      const t = s.text.trim().toLowerCase()
      if (t) terms.set(t, (terms.get(t) ?? 0) + 1)
    }
    stats.searches = { total: searches.length, top: topN(terms, 5).map(([term, count]) => ({ term, count })) }
  }

  return stats
}

