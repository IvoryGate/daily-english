import { Link, NavLink } from 'react-router'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
  }`

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">
            DailyEnglish
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            文章
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            我的学习
          </NavLink>
          <NavLink to="/vocabulary" className={navLinkClass}>
            生词本
          </NavLink>
          <NavLink to="/review" className={navLinkClass}>
            复习
          </NavLink>
          <Button size="sm" className="ml-1" asChild>
            <Link to="/new">添加文章</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}