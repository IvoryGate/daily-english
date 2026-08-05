const THEME_KEY = 'de.theme.v1'

export type Theme = 'light' | 'dark' | 'system'

function apply(theme: Theme): void {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function getTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

export function initTheme(): void {
  apply(getTheme())
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (getTheme() === 'system') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
  apply(theme)
}

export function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}
