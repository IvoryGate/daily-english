const THEME_KEY = 'de.theme.v1'
const PALETTE_KEY = 'de.palette.v1'

export type Theme = 'light' | 'dark' | 'system'
export type Palette = 'claude' | 'notion'

export const PALETTES: { value: Palette; label: string; desc: string }[] = [
  { value: 'claude', label: '温暖', desc: '奶油纸感 · 陶土珊瑚' },
  { value: 'notion', label: '专注', desc: '白纸净感 · 自信蓝' },
]

function apply(theme: Theme): void {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

function applyPalette(palette: Palette): void {
  document.documentElement.dataset.palette = palette
}

export function getTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

export function getPalette(): Palette {
  const stored = localStorage.getItem(PALETTE_KEY)
  if (stored === 'claude' || stored === 'notion') {
    return stored
  }
  return 'claude'
}

export function initTheme(): void {
  apply(getTheme())
  applyPalette(getPalette())
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

export function setPalette(palette: Palette): void {
  localStorage.setItem(PALETTE_KEY, palette)
  applyPalette(palette)
}

export function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}
