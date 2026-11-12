import JSZip from 'jszip'
import type { VirtualFile, VirtualFS } from './types'

/** Only text formats are worth reading; photos and videos in exports are skipped. */
const USEFUL = /\.(json|txt)$/i

const norm = (p: string) => p.replace(/\\/g, '/').replace(/^\/+/, '')

function memo(fn: () => Promise<string>): () => Promise<string> {
  let p: Promise<string> | undefined
  return () => (p ??= fn())
}

export function createVFS(files: VirtualFile[]): VirtualFS {
  return {
    files,
    match(test) {
      const fn = typeof test === 'function' ? test : (p: string) => test.test(p)
      return files.filter((f) => fn(f.lpath))
    },
  }
}

export function vfsFromText(entries: Record<string, string>): VirtualFS {
  return createVFS(
    Object.entries(entries).map(([path, content]) => ({
      path,
      lpath: path.toLowerCase(),
      text: async () => content,
    })),
  )
}

/** Turns dropped files (JSON files and/or ZIP archives) into one virtual file system. */
export async function vfsFromFiles(input: File[]): Promise<VirtualFS> {
  const out: VirtualFile[] = []
  for (const file of input) {
    const name = norm((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name)
    if (/\.zip$/i.test(name)) {
      const zip = await JSZip.loadAsync(file)
      zip.forEach((relPath, entry) => {
        if (entry.dir || !USEFUL.test(relPath)) return
        const path = norm(`${name}/${relPath}`)
        out.push({ path, lpath: path.toLowerCase(), text: memo(() => entry.async('string')) })
      })
    } else if (USEFUL.test(name)) {
      out.push({ path: name, lpath: name.toLowerCase(), text: memo(() => file.text()) })
    }
  }
  return createVFS(out)
}
