import { ArticleCard } from '@/components/ArticleCard'
import { useArticles } from '@/hooks/useArticles'

export function ArticleListPage() {
  const { articles, loading, error } = useArticles()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">阅读列表</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          每天一篇短文，保持英语语感
        </p>
      </section>

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
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </main>
  )
}
