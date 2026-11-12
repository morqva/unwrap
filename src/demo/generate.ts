/**
 * Generates FAKE raw exports (Telegram result.json, TikTok user_data.json, Instagram JSON files)
 * so anyone can try the site without their own data. The fake files go through the real
 * parsers, so the demo also doubles as an end-to-end check.
 */
import { vfsFromText } from '../core/vfs'
import type { VirtualFS } from '../core/types'

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Lang = 'en' | 'ru'

const VOCAB = {
  en: {
    me: 'Alex',
    contacts: [
      { name: 'Sam', weight: 10, reply: 95 },
      { name: 'Mom', weight: 6, reply: 40 },
      { name: 'Jordan', weight: 5, reply: 600 },
      { name: 'Taylor', weight: 3, reply: 1500 },
      { name: 'Chris (gym)', weight: 2, reply: 300 },
    ],
    groups: ['Flat 4B 🏠', 'Work — design team', 'Weekend trip 🏕️'],
    channel: 'Daily memes',
    words: ['vibe', 'vibe', 'vibe', 'pizza', 'deadline', 'coffee', 'tonight', 'literally', 'meeting', 'weekend', 'gym', 'movie', 'dinner', 'tired', 'crazy', 'actually', 'tomorrow', 'game', 'cat', 'beach'],
    fillers: ['ok', 'what', 'are you', 'lol', 'I think', 'so', 'yes', 'no way', 'wait', 'omg', 'same', 'see you'],
    searches: ['pasta recipe', 'gym motivation', 'cat videos', 'how to sleep faster', 'travel hacks', 'pasta recipe', 'cat videos', 'cat videos'],
    tiktokers: ['chef.marco', 'gymbro_tim', 'catsofinstagram', 'travel.with.lu', 'dance.daily', 'tech.tips'],
  },
  ru: {
    me: 'Саша',
    contacts: [
      { name: 'Маша', weight: 10, reply: 95 },
      { name: 'Мама', weight: 6, reply: 40 },
      { name: 'Дима', weight: 5, reply: 600 },
      { name: 'Лёша', weight: 3, reply: 1500 },
      { name: 'Тренер Саня', weight: 2, reply: 300 },
    ],
    groups: ['Соседи 🏠', 'Работа — дизайн', 'Поездка на выходные 🏕️'],
    channel: 'Мемы каждый день',
    words: ['вайб', 'вайб', 'вайб', 'пицца', 'дедлайн', 'кофе', 'вечером', 'реально', 'созвон', 'выходные', 'зал', 'фильм', 'ужин', 'устал', 'жесть', 'кринж', 'завтра', 'игра', 'кот', 'море'],
    fillers: ['ок', 'что', 'ты где', 'ахах', 'я думаю', 'короче', 'да', 'не может быть', 'погоди', 'капец', 'тоже', 'до встречи'],
    searches: ['рецепт пасты', 'мотивация зал', 'видео с котами', 'как быстрее уснуть', 'лайфхаки путешествия', 'рецепт пасты', 'видео с котами', 'видео с котами'],
    tiktokers: ['chef.marco', 'gymbro_tim', 'catsofinstagram', 'travel.with.lu', 'dance.daily', 'tech.tips'],
  },
}

const EMOJI = ['😂', '😂', '😂', '❤️', '🔥', '😭', '🥲', '👀', '🙏', '✨', '💀', '👍']

/** Hour distribution with an evening peak around 22–23h. */
const HOUR_WEIGHTS = [4, 2, 1, 0.5, 0.2, 0.2, 0.5, 1.5, 3, 4, 4, 4.5, 5, 5, 4.5, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 8]

function pickWeighted(r: () => number, weights: number[]) {
  const total = weights.reduce((a, b) => a + b, 0)
  let x = r() * total
  for (let i = 0; i < weights.length; i++) if ((x -= weights[i]) <= 0) return i
  return weights.length - 1
}

const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)]

const pad = (n: number) => String(n).padStart(2, '0')
const tiktokDate = (ms: number) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** Meta exports encode UTF-8 as Latin-1 — reproduce that so the fixer gets exercised. */
const mojibake = (s: string) => String.fromCharCode(...new TextEncoder().encode(s))

export function generateDemo(lang: Lang, now = Date.now()): VirtualFS {
  const r = rng(2026)
  const v = VOCAB[lang]
  // One calendar year: this year so far, or last year if it's still early January.
  const today = new Date(now)
  const thisYearStart = new Date(today.getFullYear(), 0, 1).getTime()
  const year = now - thisYearStart >= 30 * 86400_000 ? today.getFullYear() : today.getFullYear() - 1
  const start = new Date(year, 0, 1).getTime()
  const end = Math.min(now, new Date(year + 1, 0, 1).getTime() - 1)
  const days = Math.max(1, Math.floor((end - start) / 86400_000))

  const dayStart = (d: number) => {
    const t = new Date(start + (d % days) * 86400_000)
    return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
  }
  const randomTime = (d: number) => dayStart(d) + pickWeighted(r, HOUR_WEIGHTS) * 3600_000 + Math.floor(r() * 3600_000)

  const phrase = () => {
    const parts = [pick(r, v.fillers)]
    const n = 1 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++) parts.push(r() < 0.55 ? pick(r, v.words) : pick(r, v.fillers))
    let text = parts.join(' ')
    if (r() < 0.35) text += ' ' + pick(r, EMOJI)
    if (r() < 0.08) text += pick(r, EMOJI)
    return text
  }

  // ---------------- Telegram ----------------
  let msgId = 1
  const tgChats: object[] = []
  const tgMessage = (ts: number, from: string, fromId: string, text: string) => ({
    id: msgId++,
    type: 'message',
    date: new Date(ts).toISOString().slice(0, 19),
    date_unixtime: String(Math.floor(ts / 1000)),
    from,
    from_id: fromId,
    text,
  })

  v.contacts.forEach((c, ci) => {
    const messages: object[] = []
    for (let d = 0; d < days; d++) {
      const sessions = r() < c.weight / 11 ? 1 + Math.floor(r() * (c.weight / 3)) : 0
      for (let s = 0; s < sessions; s++) {
        let t = randomTime(d)
        let mine = r() < 0.5
        const len = 3 + Math.floor(r() * 12)
        for (let i = 0; i < len; i++) {
          messages.push(mine ? tgMessage(t, v.me, 'user1', phrase()) : tgMessage(t, c.name, `user${100 + ci}`, phrase()))
          const switching = r() < 0.6
          const delay = switching ? (mine ? c.reply : 70) * (0.3 + r() * 1.6) : 5 + r() * 40
          t += Math.floor(delay * 1000)
          if (switching) mine = !mine
        }
      }
    }
    messages.sort((a, b) => Number((a as { date_unixtime: string }).date_unixtime) - Number((b as { date_unixtime: string }).date_unixtime))
    tgChats.push({ name: c.name, type: 'personal_chat', id: 100 + ci, messages })
  })

  v.groups.forEach((g, gi) => {
    const messages: object[] = []
    const members = v.contacts.map((c) => c.name)
    for (let d = 0; d < days; d++) {
      if (r() > 0.45) continue
      let t = randomTime(d)
      const len = 4 + Math.floor(r() * 18)
      for (let i = 0; i < len; i++) {
        const mine = r() < 0.25
        messages.push(tgMessage(t, mine ? v.me : pick(r, members), mine ? 'user1' : `user${200 + i}`, phrase()))
        t += Math.floor((10 + r() * 200) * 1000)
      }
    }
    tgChats.push({ name: g, type: 'private_supergroup', id: 300 + gi, messages })
  })

  const telegram = {
    about: 'Here is the data you requested. (DEMO — fake data generated by Unwrap)',
    personal_information: { user_id: 1, first_name: v.me, last_name: '', phone_number: '+0 000 000 0000' },
    chats: { about: 'Chats', list: tgChats },
  }

  // ---------------- TikTok ----------------
  const views: object[] = []
  const likes: object[] = []
  for (let d = 0; d < days; d++) {
    // Weekends are worse; one legendary binge day
    const dow = new Date(dayStart(d)).getDay()
    let n = Math.floor((dow === 0 || dow === 6 ? 140 : 80) * (0.4 + r()))
    if (d === Math.floor(days * 0.55)) n = 1337
    for (let i = 0; i < n; i++) {
      const ts = randomTime(d)
      views.push({ Date: tiktokDate(ts), Link: `https://www.tiktokv.com/share/video/${7000000000000000000 + d * 10000 + i}/` })
      if (r() < 0.12) likes.push({ date: tiktokDate(ts), link: `https://www.tiktokv.com/share/video/${7000000000000000000 + d * 10000 + i}/` })
    }
  }
  const tiktok = {
    Activity: {
      'Video Browsing History': { VideoList: views },
      'Like List': { ItemFavoriteList: likes },
      'Search History': { SearchList: Array.from({ length: 160 }, (_, i) => ({ Date: tiktokDate(randomTime(i * 2)), SearchTerm: pick(r, v.searches) })) },
      'Following List': { Following: v.tiktokers.map((u, i) => ({ Date: tiktokDate(randomTime(i * 40)), UserName: u })) },
    },
    Comment: { Comments: { CommentsList: Array.from({ length: 48 }, (_, i) => ({ date: tiktokDate(randomTime(i * 7)), comment: phrase() })) } },
    Profile: { 'Profile Information': { ProfileMap: { userName: 'demo_user' } } },
  }

  // ---------------- Instagram ----------------
  const igAccounts = ['coffee.lab', 'nat.geo.travel', 'design.daily', 'ex.crush.official', 'mememachine', 'cinema.club', 'bakery_corner', 'fit.with.jo', 'city.night.photo', 'plant.mom']
  const followed = igAccounts.map((u, i) => ({ user: u, ts: dayStart(10 + i * 30) + 3600_000 * 14 }))
  const unfollowed = [
    { user: 'ex.crush.official', ts: Math.min(end, followed[3].ts + 21 * 86400_000) },
    { user: 'mememachine', ts: Math.min(end, followed[4].ts + 45 * 86400_000) },
    { user: 'fit.with.jo', ts: Math.min(end, followed[7].ts + 9 * 86400_000) },
  ]
  const igLikes = Array.from({ length: 2400 }, () => {
    const d = Math.floor(r() * days)
    return { title: pick(r, [...igAccounts.slice(0, 3), 'design.daily', 'design.daily', 'cinema.club']), string_list_data: [{ href: 'https://www.instagram.com/p/demo/', value: '👍', timestamp: Math.floor(randomTime(d) / 1000) }] }
  })
  const thread = (with_: string, n: number) => {
    const messages: object[] = []
    for (let i = 0; i < n; i++) {
      const mine = r() < 0.5
      messages.push({ sender_name: mojibake(mine ? v.me : with_), timestamp_ms: randomTime(Math.floor(r() * days)), content: mojibake(phrase()) })
    }
    return { participants: [{ name: mojibake(with_) }, { name: mojibake(v.me) }], messages, title: mojibake(with_) }
  }

  const ig = 'instagram-demo/'
  return vfsFromText({
    'Telegram Desktop/DataExport_DEMO/result.json': JSON.stringify(telegram),
    'TikTok_DEMO/user_data_tiktok.json': JSON.stringify(tiktok),
    [`${ig}personal_information/personal_information/personal_information.json`]: JSON.stringify({ profile_user: [{ string_map_data: { Name: { value: mojibake(v.me) }, Username: { value: 'demo_user' } } }] }),
    [`${ig}connections/followers_and_following/following.json`]: JSON.stringify({ relationships_following: followed.map((f) => ({ title: f.user, string_list_data: [{ href: `https://www.instagram.com/${f.user}`, timestamp: Math.floor(f.ts / 1000) }] })) }),
    [`${ig}connections/followers_and_following/recently_unfollowed_profiles.json`]: JSON.stringify({ relationships_unfollowed_users: unfollowed.map((f) => ({ string_list_data: [{ href: `https://www.instagram.com/${f.user}`, value: f.user, timestamp: Math.floor(f.ts / 1000) }] })) }),
    [`${ig}your_instagram_activity/likes/liked_posts.json`]: JSON.stringify({ likes_media_likes: igLikes }),
    [`${ig}your_instagram_activity/messages/inbox/${v.contacts[2].name}_1/message_1.json`]: JSON.stringify(thread(v.contacts[2].name, 400)),
    [`${ig}your_instagram_activity/messages/inbox/${v.contacts[0].name}_2/message_1.json`]: JSON.stringify(thread(v.contacts[0].name, 600)),
    [`${ig}logged_information/recent_searches/account_searches.json`]: JSON.stringify({ searches_user: igAccounts.slice(0, 6).map((u, i) => ({ string_map_data: { Search: { value: u }, Time: { timestamp: Math.floor(randomTime(i * 50) / 1000) } } })) }),
  })
}
