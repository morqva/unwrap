import { toBlob } from 'html-to-image'
import { FONT_CSS } from '../fonts'

/** Renders a 360×640 node at 3× → a 1080×1920 PNG (Instagram/Telegram story size). */
export async function renderPng(node: HTMLElement): Promise<Blob> {
  await document.fonts.ready
  const blob = await toBlob(node, {
    width: 360,
    height: 640,
    pixelRatio: 3,
    cacheBust: false,
    fontEmbedCSS: FONT_CSS,
    backgroundColor: '#09090f',
  })
  if (!blob) throw new Error('Could not render image')
  return blob
}

/** On phones: the native share sheet (straight to Stories). On desktop: a download. */
export async function shareOrDownload(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' })
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
