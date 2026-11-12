import type { NormalizedData, SourceParser, VirtualFS } from '../core/types'
import { telegram } from './telegram'
import { instagram } from './instagram'
import { tiktok } from './tiktok'

/**
 * All known sources. To add one: write a `SourceParser` in this folder and append it here.
 * Order matters only when two parsers could claim the same file — more specific ones go first.
 */
export const parsers: SourceParser[] = [tiktok, instagram, telegram]

export async function parseAll(fs: VirtualFS, onSource?: (name: string) => void): Promise<NormalizedData[]> {
  const out: NormalizedData[] = []
  for (const p of parsers) {
    if (!(await p.detect(fs))) continue
    onSource?.(p.name)
    const data = await p.parse(fs)
    const total =
      data.messages.length + data.views.length + data.likes.length + data.comments.length +
      data.follows.length + data.unfollows.length + data.searches.length
    if (total > 0) out.push(data)
  }
  return out
}
