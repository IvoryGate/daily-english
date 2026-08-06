import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import {
  BookOpen,
  ChevronDown,
  FileText,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Palette,
  Search,
  Settings,
  Sun,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getPalette,
  getTheme,
  PALETTES,
  setPalette,
  setTheme,
  type Palette as PaletteType,
  type Theme,
} from '@/lib/theme'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
  }`

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: '浅色', icon: <Sun className="size-4" aria-hidden="true" /> },
  { value: 'dark', label: '深色', icon: <Moon className="size-4" aria-hidden="true" /> },
  { value: 'system', label: '跟随系统', icon: <LaptopIcon className="size-4" aria-hidden="true" /> },
]

function LaptopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="12" x="3" y="4" rx="2" />
      <path d="M2 20h20" />
    </svg>
  )
}

const USER_MENU = [
  { to: '/account/dashboard', label: '我的学习', icon: LayoutDashboard },
  { to: '/account/vocabulary', label: '生词本', icon: ListChecks },
  { to: '/account/review', label: '复习', icon: BookOpen },
  { to: '/account/notes', label: '笔记', icon: FileText },
  { to: '/account/settings', label: '设置', icon: Settings },
  { to: '/account/new', label: '添加文章', icon: FilePlus2 },
]

export function SiteHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [palette, setPaletteState] = useState<PaletteType>(getPalette)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const cycleTheme = () => {
    const next = THEMES.find((t) => t.value !== theme)
    if (!next) return
    setTheme(next.value)
    setThemeState(next.value)
  }

  const cyclePalette = () => {
    const idx = PALETTES.findIndex((p) => p.value === palette)
    const next = PALETTES[(idx + 1) % PALETTES.length]
    setPalette(next.value)
    setPaletteState(next.value)
  }

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[0]
  const currentPalette = PALETTES.find((p) => p.value === palette) ?? PALETTES[0]

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        {/* 左：logo + 主导航 */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            DailyEnglish
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            文章
          </NavLink>
          <NavLink to="/path" className={navLinkClass}>
            学习路径
          </NavLink>
        </nav>

        {/* 中：搜索（占位，提交跳首页并带 q） */}
        <form
          className="mx-auto hidden w-full max-w-xs md:block"
          onSubmit={(e) => {
            e.preventDefault()
            const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
            navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
            e.currentTarget.reset()
          }}
          role="search"
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="q"
              type="search"
              placeholder="搜索文章…"
              className="h-9 pl-9"
              aria-label="搜索文章"
            />
          </div>
        </form>

        {/* 右：主题 + 用户 */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={cyclePalette}
            title={`配色：${currentPalette.label}（点击切换）`}
            aria-label={`当前配色：${currentPalette.label}，点击切换`}
          >
            <Palette className="size-4" aria-hidden="true" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={cycleTheme}
            title={`明暗：${current.label}（点击切换）`}
            aria-label={`当前明暗：${current.label}，点击切换`}
          >
            {current.icon}
          </Button>

          {user ? (
            <div className="relative ml-1" ref={menuRef}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="gap-1.5"
              >
                <span className="max-w-24 truncate">{user.username}</span>
                <ChevronDown
                  className={`size-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </Button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
                  role="menu"
                >
                  {USER_MENU.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-foreground/90 hover:bg-accent/60'
                        }`
                      }
                      role="menuitem"
                    >
                      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      {label}
                    </NavLink>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    role="menuitem"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" variant="outline" className="ml-1" asChild>
              <Link to="/login">登录</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
