import { NavLink, Outlet } from 'react-router'
import { BookOpen, FilePlus2, FileText, LayoutDashboard, ListChecks, Settings } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const tabs = [
  { to: '/account/dashboard', label: '我的学习', icon: LayoutDashboard },
  { to: '/account/vocabulary', label: '生词本', icon: ListChecks },
  { to: '/account/review', label: '复习', icon: BookOpen },
  { to: '/account/notes', label: '笔记', icon: FileText },
  { to: '/account/settings', label: '设置', icon: Settings },
  { to: '/account/new', label: '添加文章', icon: FilePlus2 },
]

function AccountLayout() {
  return (
    <div>
      <nav
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 pt-4"
        aria-label="个人中心导航"
      >
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

export function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountLayout />
    </ProtectedRoute>
  )
}
