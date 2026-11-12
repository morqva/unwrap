/**
 * The contract every source parser fulfils.
 *
 * A parser turns one platform's raw export into `NormalizedData`: flat lists of
 * timestamped events. All statistics (top chats, word of the year, peak hour…)
 * are computed by one shared engine from these lists, so a new source gets
 * every card for free just by filling in the events it has.
 */

export type SourceId = 'telegram' | 'instagram' | 'tiktok'

export type ChatType = 'personal' | 'group' | 'channel'

export interface Message {
  /** Unix time in milliseconds */
  ts: number
  /** Chat title; for personal chats this is the other person's name */
  chat: string
  chatType: ChatType
  fromMe: boolean
  sender: string
  text: string
}

export interface Event {
  ts: number
  /** Optional: whose post was liked, which video, etc. */
  target?: string
}

export interface TextEvent extends Event {
  text: string
}

export interface UserEvent {
  ts: number
  user: string
}

export interface NormalizedData {
  source: SourceId
  ownerName?: string
  messages: Message[]
  /** Videos / posts watched */
  views: Event[]
  likes: Event[]
  comments: TextEvent[]
  follows: UserEvent[]
  unfollows: UserEvent[]
  searches: TextEvent[]
}

export const emptyData = (source: SourceId): NormalizedData => ({
  source,
  messages: [],
  views: [],
  likes: [],
  comments: [],
  follows: [],
  unfollows: [],
  searches: [],
})

/** A file from the dropped files / ZIP archives. Paths use `/` separators. */
export interface VirtualFile {
  path: string
  /** Lower-cased path, handy for matching */
  lpath: string
  text(): Promise<string>
}

export interface VirtualFS {
  files: VirtualFile[]
  /** Files whose lower-cased path matches */
  match(test: RegExp | ((lpath: string) => boolean)): VirtualFile[]
}

export interface SourceParser {
  id: SourceId
  /** Human-readable name shown in the UI */
  name: string
  /** Return true if the files look like this source's export. Must be cheap-ish. */
  detect(fs: VirtualFS): Promise<boolean>
  parse(fs: VirtualFS): Promise<NormalizedData>
}
