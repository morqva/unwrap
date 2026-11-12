import type { ChatType, NormalizedData, SourceParser, VirtualFile } from '../core/types'
import { emptyData } from '../core/types'
import { safeJson, toMs, type Json } from '../core/util'

/**
 * Telegram Desktop → Settings → Advanced → Export Telegram data → format "Machine-readable JSON".
 * Produces `result.json`: either the full export ({ personal_information, chats: { list } })
 * or a single chat export ({ name, type, messages }).
 */

const TYPE_MAP: Record<string, ChatType | null> = {
  personal_chat: 'personal',
  bot_chat: null,
  saved_messages: null,
  private_group: 'group',
  private_supergroup: 'group',
  public_supergroup: 'group',
  private_channel: 'channel',
  public_channel: 'channel',
}

async function candidates(files: VirtualFile[]): Promise<VirtualFile[]> {
  const named = files.filter((f) => /(^|\/)result\.json$/.test(f.lpath))
  if (named.length) return named
  const out: VirtualFile[] = []
  for (const f of files) {
    if (!f.lpath.endsWith('.json') || /messages\/(inbox|e2ee_cutover)\//.test(f.lpath)) continue
    const text = await f.text()
    if (text.includes('"date_unixtime"')) out.push(f)
  }
  return out
}

/** Telegram stores formatted text as an array of strings and { type, text } entities. */
export function flattenText(t: Json): string {
  if (typeof t === 'string') return t
  if (Array.isArray(t)) return t.map((p) => (typeof p === 'string' ? p : (p?.text ?? ''))).join('')
  return ''
}

export const telegram: SourceParser = {
  id: 'telegram',
  name: 'Telegram',

  async detect(fs) {
    return (await candidates(fs.files)).length > 0
  },

  async parse(fs) {
    const data: NormalizedData = emptyData('telegram')
    for (const file of await candidates(fs.files)) {
      const json = safeJson(await file.text())
      if (!json) continue

      const me = json.personal_information
      const myId: string | undefined = me?.user_id != null ? `user${me.user_id}` : undefined
      if (me && !data.ownerName) data.ownerName = [me.first_name, me.last_name].filter(Boolean).join(' ') || undefined

      const chats: Json[] = [
        ...(json.chats?.list ?? []),
        ...(json.left_chats?.list ?? []),
        ...(Array.isArray(json.messages) ? [json] : []),
      ]

      for (const chat of chats) {
        const chatType = TYPE_MAP[chat.type] ?? (chat.type ? null : 'personal')
        if (!chatType || !Array.isArray(chat.messages)) continue
        const name: string = chat.name || 'Deleted account'

        // Single-chat exports have no personal_information: in a personal chat,
        // "me" is whoever isn't the chat's title.
        let selfId = myId
        if (!selfId && chatType === 'personal') {
          selfId = chat.messages.find((m: Json) => m.type === 'message' && m.from && m.from !== name)?.from_id
        }

        for (const m of chat.messages) {
          if (m.type !== 'message') continue
          const ts = toMs(m.date_unixtime) ?? toMs(m.date)
          if (!ts) continue
          let text = flattenText(m.text)
          if (!text && m.sticker_emoji) text = m.sticker_emoji
          data.messages.push({
            ts,
            chat: name,
            chatType,
            fromMe: !!selfId && m.from_id === selfId,
            sender: m.from ?? name,
            text,
          })
        }
      }
    }
    return data
  },
}
