export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light'
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try { localStorage.setItem('bl-theme', next) } catch { /* private mode */ }
  return next
}