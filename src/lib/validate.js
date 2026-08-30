const SCHEMES = ['http:', 'https:']

export function normalizeUrl(input) {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return null
  const candidate = /^[a-zA-Z][a-zA-Z0-9+-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    const parsed = new URL(candidate)
    if (!SCHEMES.includes(parsed.protocol)) return null
    if (!parsed.hostname.includes('.')) return null
    parsed.username = ''
    parsed.password = ''
    return parsed.href
  } catch {
    return null
  }
}

export function isValidUrl(input) {
  return normalizeUrl(input) !== null
}

export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
