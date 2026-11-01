/* Photos for the prototype. On a phone the button opens the camera; on a laptop it opens the file chooser.
   The picture is shrunk (long side 800 px, JPEG) so it fits in the app's saved data, and comes back as a data address
   that can be used straight in an <img>. */
import { CSSProperties } from 'react'

const MAX = 800

function shrink(file: File): Promise<string | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k))
      const g = c.getContext('2d')
      if (!g) { URL.revokeObjectURL(url); resolve(null); return }
      g.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      try { resolve(c.toDataURL('image/jpeg', 0.72)) } catch { resolve(null) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

/** Opens the camera (phone) or the file chooser (laptop). Gives the picture, or null if the person backed out. */
export function takePhoto(): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.setAttribute('capture', 'environment')
    input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
    let done = false
    const finish = (v: string | null) => { if (done) return; done = true; input.remove(); resolve(v) }
    input.addEventListener('change', () => { const f = input.files?.[0]; if (!f) finish(null); else shrink(f).then(finish) })
    input.addEventListener('cancel', () => finish(null))
    document.body.appendChild(input)
    input.click()
  })
}

/** A picture in a drawn-style frame: navy outline, hard shadow, paper border. Drop it where a photo belongs. */
export function Shot({ src, w, h, r = 10, rot = 0, style, imgStyle }: { src: string; w: number; h: number; r?: number; rot?: number; style?: CSSProperties; imgStyle?: CSSProperties }) {
  return (
    <div style={{ width: w, height: h, boxSizing: 'border-box', borderRadius: r, border: '2.5px solid #00224E', background: '#FFFBF3', boxShadow: '3px 4px 0 #00224E', transform: rot ? `rotate(${rot}deg)` : undefined, overflow: 'hidden', ...style }}>
      <img src={src} alt="Photo taken" draggable={false} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...imgStyle }} />
    </div>
  )
}
