export function hexToRgb(hex) {
  const h    = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n    = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function luminance({ r, g, b }) {
  const channel = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2]
}

function mixHex(hex, white, ratio) {
  const { r, g, b } = hexToRgb(hex)
  const wr = parseInt(white.slice(1, 3), 16)
  const wg = parseInt(white.slice(3, 5), 16)
  const wb = parseInt(white.slice(5, 7), 16)
  const mix   = (a, w) => Math.round(a + (w - a) * ratio)
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(mix(r, wr))}${toHex(mix(g, wg))}${toHex(mix(b, wb))}`
}

function darkenHex(hex, ratio) {
  const { r, g, b } = hexToRgb(hex)
  const d     = v => Math.round(v * (1 - ratio))
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`
}

export function getBrandCSSVars(colour) {
  const hex       = colour || '#1C1814'
  const rgb       = hexToRgb(hex)
  const lum       = luminance(rgb)
  const onPrimary = lum > 0.35 ? '#1a1a1a' : '#ffffff'

  return {
    '--brand-primary':      hex,
    '--brand-primary-dark': darkenHex(hex, 0.25),
    '--brand-gradient':     hex,
    '--brand-on-primary':   onPrimary,
    '--brand-muted':        mixHex(hex, '#ffffff', 0.75),
    '--brand-surface':      mixHex(hex, '#ffffff', 0.92),
  }
}

