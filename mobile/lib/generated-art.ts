export const GENERATED_PREFIX = "generated:"

export function isGeneratedArt(uri: string | null | undefined) {
  return Boolean(uri && uri.startsWith(GENERATED_PREFIX) && /^#[0-9a-f]{6}$/i.test(uri.slice(GENERATED_PREFIX.length)))
}

export function generatedColor(uri: string) {
  return uri.slice(GENERATED_PREFIX.length)
}

export function inkFor(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16)
  if (Number.isNaN(n)) return "#ffffff"
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.58 ? "#111111" : "#ffffff"
}

export function makeGeneratedArt() {
  for (let i = 0; i < 32; i++) {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    if (r > 228 && g > 228 && b > 228) continue
    if (lum > 0.9) continue
    return `${GENERATED_PREFIX}#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`
  }
  return `${GENERATED_PREFIX}#1d9bf0`
}
