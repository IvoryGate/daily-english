import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { LoaderCircle, Search, Sparkles, Shuffle, Wand2 } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { ArticleThumb } from '@/components/ArticleThumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { fetchStats, type StatsData } from '@/api/me'
import { useArticles } from '@/hooks/useArticles'
import { useAuth } from '@/context/AuthContext'
import { useUserData } from '@/context/UserDataContext'
import { difficultyForLevel, difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import { sourceLabel } from '@/lib/sourceLabels'
import type { ArticleSource, Difficulty } from '@/types'
import type { SortKey } from '@/api/articles'

const PAGE_SIZE = 10
const DIFFICULTIES: (Difficulty | '')[] = ['', 'beginner', 'intermediate', 'advanced']
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'latest', label: '最新' },
  { value: 'longest', label: '最长' },
  { value: 'shortest', label: '最短' },
]

export function ArticleListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { reading } = useUserData()
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get('q') ?? '',
  )
  const deferredSearch = useDeferredValue(searchInput.trim())
  const [source, setSource] = useState<ArticleSource | 'all'>('all')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [sort, setSort] = useState<SortKey>('latest')
  const [crawling, setCrawling] = useState(false)
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [stats, setStats] = useState<StatsData | null>(null)

  const query = useMemo(
    () => ({ q: deferredSearch, difficulty, sort }),
    [deferredSearch, difficulty, sort],
  )
  const { articles, loading, error, refresh } = useArticles(query)

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [deferredSearch, source, difficulty, sort])

  useEffect(() => {
    if (!user) {
      setStats(null)
      return
    }
    let active = true
    fetchStats()
      .then((data) => {
        if (active) setStats(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  const sources = useMemo(() => {
    const set = new Set<string>()
    for (const a of articles) {
      if (a.source) set.add(a.source)
    }
    return Array.from(set)
  }, [articles])

  const filteredBySource = useMemo(
    () => (source === 'all' ? articles : articles.filter((a) => a.source === source)),
    [articles, source],
  )

  const visibleArticles = filteredBySource.slice(0, visible)
  const hasMore = visible < filteredBySource.length

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: articles.length }
    for (const a of articles) {
      const s = a.source ?? 'seed'
      map[s] = (map[s] ?? 0) + 1
    }
    return map
  }, [articles])

  // 今日推荐：按日期确定性挑选（每天固定一篇，不随机跳动）
  const dailyPick = useMemo(() => {
    if (filteredBySource.length === 0) return undefined
    const dayNumber = Math.floor(Date.now() / 86400000)
    return filteredBySource[dayNumber % filteredBySource.length]
  }, [filteredBySource])

  // 为你推荐：登录后按等级推荐合适难度的未读文章
  const recommended = useMemo(() => {
    if (!stats || stats.level.level === 0) return []
    const levels = difficultyForLevel(stats.level.level)
    const pool = articles.filter((a) => levels.includes(a.difficulty))
    const unread = pool.filter((a) => !reading[a.id])
    // 优先未读，取前 3 篇
    return (unread.length > 0 ? unread : pool).slice(0, 3)
  }, [stats, articles, reading])

  const goRandom = () => {
    if (visibleArticles.length === 0) return
    const pick = visibleArticles[Math.floor(Math.random() * visibleArticles.length)]
    navigate(`/articles/${pick.id}`)
  }

  const runCrawl = async () => {
    setCrawling(true)
    setCrawlMessage(null)
    try {
      const res = await fetch('/api/crawl', { method: 'POST' })
      if (!res.ok) {
        throw new Error('抓取失败')
      }
      const { task_id } = (await res.json()) as { task_id: string }
      let task: { status: string; result?: { inserted?: number } }
      do {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const statusRes = await fetch(`/api/crawl/status/${task_id}`)
        task = (await statusRes.json()) as typeof task
      } while (task.status === 'running')
      if (task.status === 'done') {
        setCrawlMessage(`抓取完成，新增 ${task.result?.inserted ?? 0} 篇`)
        refresh()
      } else {
        setCrawlMessage('抓取失败，请稍后重试')
      }
    } catch {
      setCrawlMessage('抓取失败，请稍后重试')
    } finally {
      setCrawling(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* 页头 */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">阅读列表</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            每天一篇短文，保持英语语感
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={goRandom}
            disabled={visibleArticles.length === 0}
          >
            <Shuffle className="size-4" aria-hidden="true" />
            随机一篇
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={runCrawl}
            disabled={crawling}
          >
            {crawling && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            )}
            {crawling ? '抓取中…' : '同步外部文章'}
          </Button>
        </div>
      </section>
      {crawlMessage && (
        <p className="mb-4 text-xs text-muted-foreground">{crawlMessage}</p>
      )}

      {/* 主推 HERO：今日推荐 */}
      {dailyPick && (
        <section className="mb-8">
          <Link
            to={`/articles/${dailyPick.id}`}
            className="group relative block overflow-hidden rounded-3xl border border-primary/15 transition-all hover:border-primary/30 hover:shadow-lg"
          >
            <ArticleThumb
              article={dailyPick}
              className="h-64 w-full transition-transform duration-500 group-hover:scale-105 md:h-80"
            />
            <div className="relative bg-gradient-to-br from-primary/10 via-background to-background p-8">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                今日推荐
              </div>
              <h2 className="mt-4 max-w-2xl font-reading text-3xl font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                {dailyPick.title}
              </h2>
              <p className="mt-3 max-w-2xl line-clamp-3 text-sm leading-6 text-muted-foreground">
                {dailyPick.excerpt}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge className={difficultyStyles[dailyPick.difficulty]}>
                  {difficultyLabels[dailyPick.difficulty]}
                </Badge>
                {dailyPick.source && dailyPick.source !== 'seed' && (
                  <span>{sourceLabel(dailyPick.source)}</span>
                )}
                <span>· {dailyPick.readTimeMinutes} 分钟</span>
                <span className="text-primary">开始阅读 →</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 主内容区：左栏文章 + 右栏筛选 */}
      <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
        {/* 左栏：推荐 + 文章网格 */}
        <div className="min-w-0">
          {user && recommended.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <Wand2 className="size-4 text-primary" aria-hidden="true" />
                为你推荐
                <span className="text-xs font-normal text-muted-foreground">
                  Lv{stats?.level.level} {stats?.level.name}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {recommended.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {/* 搜索 + 排序工具条 */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="搜索标题或正文…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
                aria-label="搜索文章"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 shrink-0 rounded-md border bg-background px-2 text-sm"
              aria-label="排序方式"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2" aria-label="加载中">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
                {visibleArticles.length === 0 && (
                  <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                    没有符合条件的文章
                  </p>
                )}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  >
                    加载更多
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 右栏：筛选侧栏 */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border bg-card p-4 text-card-foreground">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              难度
            </p>
            <div className="flex flex-col gap-1" role="tablist" aria-label="难度筛选">
              {DIFFICULTIES.map((d) => (
                <Button
                  key={d || 'all'}
                  size="sm"
                  variant={difficulty === d ? 'default' : 'ghost'}
                  onClick={() => setDifficulty(d)}
                  aria-pressed={difficulty === d}
                  className="justify-start"
                >
                  {d ? difficultyLabels[d] : '全部难度'}
                </Button>
              ))}
            </div>

            <Separator className="my-3" />

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              来源
            </p>
            <div className="flex flex-col gap-1" role="tablist" aria-label="文章来源筛选">
              <Button
                size="sm"
                variant={source === 'all' ? 'default' : 'ghost'}
                onClick={() => setSource('all')}
                aria-pressed={source === 'all'}
                className="justify-between"
              >
                <span>全部</span>
                <span className="text-xs opacity-70">{counts.all}</span>
              </Button>
              {sources.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={source === s ? 'default' : 'ghost'}
                  onClick={() => setSource(s as ArticleSource)}
                  aria-pressed={source === s}
                  className="justify-between"
                >
                  <span>{sourceLabel(s)}</span>
                  <span className="text-xs opacity-70">{counts[s] ?? 0}</span>
                </Button>
              ))}
            </div>
          </div>
        </aside>

        {/* 移动端：横向滚动筛选条 */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {DIFFICULTIES.map((d) => (
            <Button
              key={d || 'all'}
              size="sm"
              variant={difficulty === d ? 'default' : 'ghost'}
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
            >
              {d ? difficultyLabels[d] : '全部难度'}
            </Button>
          ))}
          <Separator orientation="vertical" className="mx-1" />
          {sources.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={source === s ? 'default' : 'ghost'}
              onClick={() => setSource(s as ArticleSource)}
              aria-pressed={source === s}
            >
              {sourceLabel(s)}
            </Button>
          ))}
        </div>
      </div>
    </main>
  )
}
