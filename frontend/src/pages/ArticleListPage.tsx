import { ArticleCard } from '@/components/ArticleCard'
import { SiteHeader } from '@/components/SiteHeader'
import { mockArticles } from '@/lib/mockArticles'

interface ArticleListPageProps {
  onSelect: (id: number) => void
}

export function ArticleListPage({ onSelect }: ArticleListPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <section className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">阅读列表</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            每天一篇短文，保持英语语感
          </p>
        </section>
        <div className="flex flex-col gap-3">
          {mockArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onSelect={onSelect}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
