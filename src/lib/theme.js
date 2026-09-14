export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light'
}

export function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', next)
  try { localStorage.setItem('bl-theme', next) } catch { /* private mode */ }
  return next
}

export function toggleTheme() {
  return setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
}