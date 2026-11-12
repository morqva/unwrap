import type { NormalizedData, SourceParser, VirtualFile } from '../core/types'
import { emptyData } from '../core/types'
import { findArray, findObject, prop, safeJson, toMs, type Json } from '../core/util'

/**
 * TikTok → Settings and privacy → Account → Download your data → format "JSON".
 * Produces `user_data.json` (sometimes `user_data_tiktok.json`). Section names shift
 * between versions ("Activity" vs "Your Activity"), so arrays are found by key anywhere.
 */

async function candidates(files: VirtualFile[]): Promise<VirtualFile[]> {
  const named = files.filter((f) => /(^|\/)user_data[^/]*\.json$/.test(f.lpath))
  if (named.length) return named
  const out: VirtualFile[] = []
  for (const f of files) {
    if (!f.lpath.endsWith('.json') || /result\.json$/.test(f.lpath)) continue
    const text = await f.text()
    if (text.includes('"VideoList"') || text.includes('Video Browsing History')) out.push(f)
  }
  return out
}

const date = (e: Json) => toMs(prop(e, 'Date', 'date'))

export const tiktok: SourceParser = {
  id: 'tiktok',
  name: 'TikTok',

  async detect(fs) {
    return (await candidates(fs.files)).length > 0
  },

  async parse(fs) {
    const data: NormalizedData = emptyData('tiktok')
    for (const file of await candidates(fs.files)) {
      const json = safeJson(await file.text())
      if (!json) continue

      const profile = findObject(json, ['ProfileMap'])
      const me: string | undefined = prop(profile, 'userName', 'username')
      if (me) data.ownerName = me

      for (const e of findArray(json, ['VideoList']) ?? []) {
        const ts = date(e)
        if (ts) data.views.push({ ts, target: prop(e, 'Link', 'link') })
      }
      for (const e of findArray(json, ['ItemFavoriteList']) ?? []) {
        const ts = date(e)
        if (ts) data.likes.push({ ts, target: prop(e, 'Link', 'link') })
      }
      for (const e of findArray(json, ['SearchList']) ?? []) {
        const ts = date(e)
        const text = prop(e, 'SearchTerm', 'searchTerm')
        if (ts && text) data.searches.push({ ts, text })
      }
      for (const e of findArray(json, ['CommentsList']) ?? []) {
        const ts = date(e)
        if (ts) data.comments.push({ ts, text: prop(e, 'Comment', 'comment') ?? '' })
      }
      for (const e of findArray(json, ['Following']) ?? []) {
        const ts = date(e)
        const user = prop(e, 'UserName', 'username')
        if (ts && user) data.follows.push({ ts, user })
      }

      // DMs: { "Chat History with alice:": [{ Date, From, Content }] }
      const chatHistory = findObject(json, ['ChatHistory'])
      if (chatHistory) {
        for (const [key, list] of Object.entries(chatHistory)) {
          if (!Array.isArray(list)) continue
          const chat = key.replace(/^chat history with\s*/i, '').replace(/:\s*$/, '') || 'TikTok'
          for (const m of list as Json[]) {
            const ts = date(m)
            if (!ts) continue
            const sender = prop(m, 'From', 'from') ?? ''
            data.messages.push({
              ts,
              chat,
              chatType: 'personal',
              fromMe: !!me && sender === me,
              sender,
              text: prop(m, 'Content', 'content') ?? '',
            })
          }
        }
      }
    }
    return data
  },
}
