import { useMemo, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { Button } from '@/components/ui/button'
import { useArticles } from '@/hooks/useArticles'
import { sourceLabel } from '@/lib/sourceLabels'

type Filter = 'all' | string

export function ArticleListPage() {
  const { articles, loading, error, refresh } = useArticles()
  const [filter, setFilter] = useState<Filter>('all')
  const [crawling, setCrawling] = useState(false)
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null)

  const sources = useMemo(() => {
    const set = new Set<string>()
    for (const a of articles) {
      if (a.source) set.add(a.source)
    }
    return Array.from(set)
  }, [articles])

  const filtered =
    filter === 'all' ? articles : articles.filter((a) => a.source === filter)

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
      const data = (await res.json()) as { inserted?: number }
      if (!res.ok) {
        throw new Error('抓取失败')
      }
      setCrawlMessage(`本次新增 ${data.inserted ?? 0} 篇`)
      refresh()
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

      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="文章来源筛选"
      >
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          全部
          <span className="ml-1 text-xs opacity-70">{counts.all}</span>
        </Button>
        {sources.map((source) => (
          <Button
            key={source}
            size="sm"
            variant={filter === source ? 'default' : 'ghost'}
            onClick={() => setFilter(source)}
            aria-pressed={filter === source}
          >
            {sourceLabel(source)}
            <span className="ml-1 text-xs opacity-70">
              {counts[source] ?? 0}
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
        <div className="flex flex-col gap-3">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              没有文章，试试「同步外部文章」或「添加文章」
            </p>
          )}
        </div>
      )}
    </main>
  )
}
