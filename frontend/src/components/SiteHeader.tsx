import { BookOpen } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">
            DailyEnglish
          </span>
        </div>
        <span className="text-xs text-muted-foreground">每日英语阅读</span>
      </div>
    </header>
  )
}
