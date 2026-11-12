/* Small helpers shared by parsers. Exports are messy, so everything is defensive. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any

export function safeJson(text: string): Json | undefined {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Accepts unix seconds, unix ms, ISO strings and "YYYY-MM-DD HH:MM:SS" (treated as UTC). */
export function toMs(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  if (typeof v === 'number' || (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v))) {
    const n = Number(v)
    if (!Number.isFinite(n) || n <= 0) return undefined
    return n < 1e12 ? n * 1000 : n
  }
  if (typeof v === 'string') {
    const s = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(v) ? v.replace(' ', 'T') + 'Z' : v
    const t = Date.parse(s)
    return Number.isNaN(t) ? undefined : t
  }
  return undefined
}

const decoder = new TextDecoder('utf-8', { fatal: true })

/**
 * Meta exports (Instagram/Facebook) store UTF-8 bytes as Latin-1 characters,
 * so "Привет" arrives as "Ð\u009fÑ\u0080Ð¸Ð²ÐµÑ\u0082". This undoes that.
 */
export function fixMojibake(s: string): string {
  if (!s) return s
  let needs = false
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c > 255) return s
    if (c > 127) needs = true
  }
  if (!needs) return s
  try {
    const bytes = new Uint8Array(s.length)
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
    return decoder.decode(bytes)
  } catch {
    return s
  }
}

/** Case-insensitive property lookup. */
export function prop(obj: Json, ...keys: string[]): Json {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of keys) {
    if (key in obj) return obj[key]
    const lk = key.toLowerCase()
    for (const k of Object.keys(obj)) if (k.toLowerCase() === lk) return obj[k]
  }
  return undefined
}

/** Depth-first search for the first array stored under one of `keys` (case-insensitive). */
export function findArray(obj: Json, keys: string[], depth = 0): Json[] | undefined {
  if (!obj || typeof obj !== 'object' || depth > 8) return undefined
  const lkeys = keys.map((k) => k.toLowerCase())
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v) && lkeys.includes(k.toLowerCase())) return v
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = findArray(v, keys, depth + 1)
      if (found) return found
    }
  }
  return undefined
}

/** Depth-first search for the first object stored under one of `keys`. */
export function findObject(obj: Json, keys: string[], depth = 0): Json | undefined {
  if (!obj || typeof obj !== 'object' || depth > 8) return undefined
  const lkeys = keys.map((k) => k.toLowerCase())
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && lkeys.includes(k.toLowerCase())) return v
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = findObject(v, keys, depth + 1)
      if (found) return found
    }
  }
  return undefined
}
