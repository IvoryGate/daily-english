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
        <p className="text-sm text-muted-foreground">加载中…</p>
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
