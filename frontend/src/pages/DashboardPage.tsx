import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  Bookmark,
  BookOpen,
  CalendarDays,
  Eraser,
  Library,
  LineChart,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchArticles } from '@/api/articles'
import { useUserData } from '@/context/UserDataContext'
import { isDue } from '@/lib/fsrs'
import { difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import { clearDictCache, getDictCache } from '@/lib/storage'
import type { Article } from '@/types'

function weekStart(): number {
  const now = new Date()
  const day = now.getDay() || 7
  const start = new Date(now)
  start.setDate(now.getDate() - day + 1)
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

export function DashboardPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const { reading, vocabulary, bookmarks, migrated } = useUserData()

  useEffect(() => {
    let active = true
    fetchArticles()
      .then((data) => {
        if (active) setArticles(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const history = reading
    const vocab = vocabulary
    const bookmarksList = bookmarks
    const dictCache = getDictCache()
    const byId = new Map(articles.map((a) => [a.id, a]))

    const ids = Object.keys(history).map(Number)
    const totalRead = ids.length
    const weekStartTime = weekStart()
    const weekRead = ids.filter(
      (id) => new Date(history[id].readAt).getTime() >= weekStartTime,
    ).length
    const wordsRead = ids.reduce(
      (sum, id) => sum + (byId.get(id)?.readTimeMinutes ?? 2) * 200,
      0,
    )

    const recent = ids
      .sort(
        (a, b) =>
          new Date(history[b].readAt).getTime() -
          new Date(history[a].readAt).getTime(),
      )
      .slice(0, 6)
      .map((id) => ({ id, article: byId.get(id) }))

    const dueCount = vocab.filter((w) => isDue(w.card)).length

    return {
      totalRead,
      weekRead,
      wordsRead,
      vocabCount: vocab.length,
      bookmarkCount: bookmarksList.length,
      dictCacheCount: Object.keys(dictCache).length,
      dueCount,
      recent,
    }
  }, [articles, reading, vocabulary, bookmarks])

  const [dictCount, setDictCount] = useState(stats.dictCacheCount)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">我的学习</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          你的阅读足迹与学习数据
        </p>
        {migrated && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            本机旧数据已同步到云端，现在换设备也能继续学习
          </p>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-3" aria-label="加载中">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<LineChart className="size-4" aria-hidden="true" />}
              label="累计阅读"
              value={`${stats.totalRead} 篇`}
            />
            <StatCard
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
              label="本周阅读"
              value={`${stats.weekRead} 篇`}
            />
            <StatCard
              icon={<BookOpen className="size-4" aria-hidden="true" />}
              label="累计阅读词数"
              value={stats.wordsRead.toLocaleString()}
            />
            <StatCard
              icon={<Library className="size-4" aria-hidden="true" />}
              label="生词本"
              value={`${stats.vocabCount} 词`}
            />
            <StatCard
              icon={<Sparkles className="size-4" aria-hidden="true" />}
              label="待复习"
              value={`${stats.dueCount} 词`}
            />
          </div>

          {stats.dueCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <span>有 {stats.dueCount} 个生词待复习</span>
              <Link to="/review" className="ml-auto text-primary hover:underline">
                去复习
              </Link>
            </div>
          )}

          {stats.bookmarkCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <Bookmark className="size-4 text-primary" aria-hidden="true" />
              <span>你收藏了 {stats.bookmarkCount} 篇文章</span>
              <Link to="/" className="ml-auto text-primary hover:underline">
                去阅读收藏
              </Link>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
            <Library className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>词典缓存 {dictCount} 条</span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => {
                clearDictCache()
                setDictCount(0)
              }}
            >
              <Eraser className="size-4" aria-hidden="true" />
              清理缓存
            </Button>
          </div>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">最近阅读</h2>
            {stats.recent.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                还没有阅读记录，去读一篇文章吧
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.recent.map(({ id, article }) => (
                  <li key={id}>
                    <Link
                      to={`/articles/${id}`}
                      className="block rounded-xl border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium">
                          {article?.title ?? `文章 #${id}`}
                        </span>
                        <span
                          className={`shrink-0 text-xs ${article ? difficultyStyles[article.difficulty] : 'text-muted-foreground'}`}
                        >
                          {article
                            ? difficultyLabels[article.difficulty]
                            : '本地'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(
                          reading[id].readAt,
                        ).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-8 flex gap-3">
            <Button asChild>
              <Link to="/">继续阅读</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/review">复习生词</Link>
            </Button>
          </div>
        </>
      )}
    </main>
  )
}
