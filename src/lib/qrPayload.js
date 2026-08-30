export const CAP_CHARS = 2000

function toBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin)
}

function fromBase64(b64) {
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function linkQrPayload(link) {
  return link.url
}

export function collectionQrPayload(links, origin = window.location.origin, pathname = window.location.pathname) {
  const sorted = [...links].sort((a, b) => b.createdAt - a.createdAt)
  const total = sorted.length
  const slim = (l) => ({ t: l.title || '', u: l.url, d: l.domain || '' })

  let items = sorted.slice(0, 50).map(slim)
  const encode = (list) => toBase64(JSON.stringify({ v: 1, total, items: list }))

  let encoded = encode(items)
  while (encoded.length > CAP_CHARS && items.length > 1) {
    items = items.slice(0, items.length - 1)
    encoded = encode(items)
  }
  if (encoded.length > CAP_CHARS) {
    encoded = encode([])
  }

  return {
    url: `${origin}${pathname}#/s/${encoded}`,
    included: JSON.parse(fromBase64(encoded)).items.length,
    total,
  }
}

export function decodeSharedPayload(raw) {
  try {
    if (!raw) return null
    const obj = JSON.parse(fromBase64(decodeURIComponent(raw)))
    if (!obj || obj.v !== 1 || !Array.isArray(obj.items)) return null
    const items = obj.items
      .filter((it) => typeof it.u === 'string' && it.u.startsWith('http'))
      .map((it) => ({ title: String(it.t ?? ''), url: it.u, domain: String(it.d ?? '') }))
    return { total: Number(obj.total) || items.length, items }
  } catch {
    return null
  }
}
