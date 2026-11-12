/* Parsing runs in a Web Worker so a 500 MB Telegram export doesn't freeze the page.
   The worker has no network code at all — it only reads the files you dropped. */
import { vfsFromFiles } from './vfs'
import { parseAll } from '../parsers'

export type WorkerIn = { files: File[] }
export type WorkerOut =
  | { type: 'progress'; source: string }
  | { type: 'done'; data: import('./types').NormalizedData[] }
  | { type: 'error'; message: string }

const ctx = self as unknown as { postMessage(m: WorkerOut): void; onmessage: ((e: MessageEvent<WorkerIn>) => void) | null }

ctx.onmessage = async (e) => {
  try {
    const fs = await vfsFromFiles(e.data.files)
    const data = await parseAll(fs, (source) => ctx.postMessage({ type: 'progress', source }))
    ctx.postMessage({ type: 'done', data })
  } catch (err) {
    ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
