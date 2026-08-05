import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { BookOpen, Laptop, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { getTheme, setTheme, type Theme } from '@/lib/theme'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
  }`

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: '浅色', icon: <Sun className="size-4" aria-hidden="true" /> },
  { value: 'dark', label: '深色', icon: <Moon className="size-4" aria-hidden="true" /> },
  { value: 'system', label: '跟随系统', icon: <Laptop className="size-4" aria-hidden="true" /> },
]

export function SiteHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setThemeState] = useState<Theme>(getTheme)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const cycleTheme = () => {
    const next = THEMES.find((t) => t.value !== theme)
    if (!next) return
    setTheme(next.value)
    setThemeState(next.value)
  }

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[0]

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            DailyEnglish
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            文章
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              我的学习
            </NavLink>
          )}
          {user && (
            <NavLink to="/vocabulary" className={navLinkClass}>
              生词本
            </NavLink>
          )}
          {user && (
            <NavLink to="/review" className={navLinkClass}>
              复习
            </NavLink>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={cycleTheme}
            title={`主题：${current.label}（点击切换）`}
            aria-label={`当前主题：${current.label}，点击切换`}
            className="ml-1"
          >
            {current.icon}
          </Button>
          <Button size="sm" className="ml-1" asChild>
            <Link to="/new">添加文章</Link>
          </Button>
          {user ? (
            <div className="ml-1 flex items-center gap-1">
              <NavLink
                to="/settings"
                className="hidden max-w-24 truncate rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground sm:inline"
                title="个人设置"
              >
                {user.username}
              </NavLink>
              <Button size="sm" variant="ghost" onClick={handleLogout}>
                退出
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="ml-1" asChild>
              <Link to="/login">登录</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
