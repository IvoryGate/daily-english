import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Search } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useArticles } from '@/hooks/useArticles'
import { difficultyLabels } from '@/lib/difficulty'
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
  const [searchInput, setSearchInput] = useState('')
  const deferredSearch = useDeferredValue(searchInput.trim())
  const [source, setSource] = useState<ArticleSource | 'all'>('all')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [sort, setSort] = useState<SortKey>('latest')
  const [crawling, setCrawling] = useState(false)
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const query = useMemo(
    () => ({ q: deferredSearch, source, difficulty, sort }),
    [deferredSearch, source, difficulty, sort],
  )
  const { articles, loading, error, refresh } = useArticles(query)

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [deferredSearch, source, difficulty, sort])

  const sources = useMemo(() => {
    const set = new Set<string>()
    for (const a of articles) {
      if (a.source) set.add(a.source)
    }
    return Array.from(set)
  }, [articles])

  const visibleArticles = articles.slice(0, visible)
  const hasMore = visible < articles.length

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: articles.length }
    for (const a of articles) {
      const s = a.source ?? 'seed'
      map[s] = (map[s] ?? 0) + 1
    }
    return map
  }, [articles])

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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">阅读列表</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              每天一篇短文，保持英语语感
            </p>
          </div>
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
        {crawlMessage && (
          <p className="mt-2 text-xs text-muted-foreground">{crawlMessage}</p>
        )}
      </section>

      <div className="mb-3 flex items-center gap-2">
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

      <div className="mb-2 flex flex-wrap gap-2" role="tablist" aria-label="难度筛选">
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
      </div>

      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="文章来源筛选"
      >
        <Button
          size="sm"
          variant={source === 'all' ? 'default' : 'ghost'}
          onClick={() => setSource('all')}
          aria-pressed={source === 'all'}
        >
          全部
          <span className="ml-1 text-xs opacity-70">{counts.all}</span>
        </Button>
        {sources.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={source === s ? 'default' : 'ghost'}
            onClick={() => setSource(s as ArticleSource)}
            aria-pressed={source === s}
          >
            {sourceLabel(s)}
            <span className="ml-1 text-xs opacity-70">
              {counts[s] ?? 0}
            </span>
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-3" aria-label="加载中">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <>
          <div className="flex flex-col gap-3">
            {visibleArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
            {visibleArticles.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
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
    </main>
  )
}
