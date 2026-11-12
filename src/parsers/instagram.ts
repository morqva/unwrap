import type { NormalizedData, SourceParser, VirtualFile } from '../core/types'
import { emptyData } from '../core/types'
import { fixMojibake, safeJson, toMs, type Json } from '../core/util'

/**
 * Instagram → Accounts Center → Your information and permissions → Download your information,
 * format "JSON". Folder names changed over the years, so files are matched by name, not full path.
 */

const MATCH = {
  threads: /messages\/(inbox|e2ee_cutover)\/[^/]+\/message_\d+\.json$/,
  likes: /(^|\/)liked_posts\.json$/,
  comments: /(^|\/)(post_comments(_\d+)?|reels_comments)\.json$/,
  following: /(^|\/)following\.json$/,
  unfollowed: /(^|\/)recently_unfollowed_(profiles|accounts)\.json$/,
  searches: /(^|\/)(account_searches|word_or_phrase_searches|tag_searches|keyword_searches)\.json$/,
  profile: /(^|\/)personal_information\.json$/,
}

const SIGNATURE = /(your_instagram_activity|followers_and_following|messages\/inbox\/|liked_posts\.json|instagram)/

async function readAll(files: VirtualFile[]): Promise<Json[]> {
  const out: Json[] = []
  for (const f of files) {
    const j = safeJson(await f.text())
    if (j !== undefined) out.push(j)
  }
  return out
}

/** Meta wraps lists in an object with one array property ({ relationships_following: [...] }). */
function entries(json: Json): Json[] {
  if (Array.isArray(json)) return json
  if (json && typeof json === 'object') for (const v of Object.values(json)) if (Array.isArray(v)) return v
  return []
}

function entryTs(e: Json): number | undefined {
  const sld = e?.string_list_data?.[0]
  if (sld?.timestamp) return toMs(sld.timestamp)
  const smd = e?.string_map_data
  if (smd) for (const v of Object.values(smd) as Json[]) if (v?.timestamp) return toMs(v.timestamp)
  return toMs(e?.timestamp ?? e?.timestamp_ms)
}

/** The first meaningful string value in an entry, preferring the given keys. */
function entryValue(e: Json, prefer: string[] = []): string | undefined {
  const smd = e?.string_map_data
  if (smd) {
    for (const k of prefer) if (smd[k]?.value) return fixMojibake(smd[k].value)
    for (const v of Object.values(smd) as Json[]) if (typeof v?.value === 'string' && v.value) return fixMojibake(v.value)
  }
  if (e?.title) return fixMojibake(e.title)
  const sld = e?.string_list_data?.[0]
  if (sld?.value) return fixMojibake(sld.value)
  return undefined
}

export const instagram: SourceParser = {
  id: 'instagram',
  name: 'Instagram',

  async detect(fs) {
    return fs.files.some((f) => SIGNATURE.test(f.lpath) && f.lpath.endsWith('.json'))
  },

  async parse(fs) {
    const data: NormalizedData = emptyData('instagram')

    // Owner
    for (const j of await readAll(fs.match(MATCH.profile))) {
      const smd = j?.profile_user?.[0]?.string_map_data
      const name = smd?.Name?.value || smd?.Username?.value
      if (name) data.ownerName = fixMojibake(name)
    }

    // Direct messages
    const threads = await readAll(fs.match(MATCH.threads))
    let me = data.ownerName
    if (!me) {
      // The owner is the participant present in (almost) every thread.
      const seen = new Map<string, number>()
      for (const t of threads) for (const p of t.participants ?? []) seen.set(p.name, (seen.get(p.name) ?? 0) + 1)
      me = [...seen.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
      if (me) data.ownerName = fixMojibake(me)
    }
    const meFixed = me && fixMojibake(me)
    for (const t of threads) {
      const participants: string[] = (t.participants ?? []).map((p: Json) => fixMojibake(p.name))
      const isGroup = participants.length > 2
      const title = fixMojibake(t.title || participants.find((p) => p !== meFixed) || 'Instagram')
      for (const m of t.messages ?? []) {
        const ts = toMs(m.timestamp_ms)
        if (!ts) continue
        const sender = fixMojibake(m.sender_name ?? '')
        data.messages.push({
          ts,
          chat: title,
          chatType: isGroup ? 'group' : 'personal',
          fromMe: !!meFixed && sender === meFixed,
          sender,
          text: m.content ? fixMojibake(m.content) : '',
        })
      }
    }

    for (const j of await readAll(fs.match(MATCH.likes))) {
      for (const e of entries(j)) {
        const ts = entryTs(e)
        if (ts) data.likes.push({ ts, target: entryValue(e) })
      }
    }

    for (const j of await readAll(fs.match(MATCH.comments))) {
      for (const e of entries(j)) {
        const ts = entryTs(e)
        if (ts) data.comments.push({ ts, text: entryValue(e, ['Comment']) ?? '', target: e?.string_map_data?.['Media Owner']?.value })
      }
    }

    for (const j of await readAll(fs.match(MATCH.following))) {
      for (const e of entries(j)) {
        const ts = entryTs(e)
        const user = entryValue(e)
        if (ts && user) data.follows.push({ ts, user })
      }
    }

    for (const j of await readAll(fs.match(MATCH.unfollowed))) {
      for (const e of entries(j)) {
        const ts = entryTs(e)
        const user = entryValue(e)
        if (ts && user) data.unfollows.push({ ts, user })
      }
    }

    for (const j of await readAll(fs.match(MATCH.searches))) {
      for (const e of entries(j)) {
        const ts = entryTs(e)
        const text = entryValue(e, ['Search'])
        if (ts && text) data.searches.push({ ts, text })
      }
    }

    return data
  },
}
