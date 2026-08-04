import { Link, useParams } from 'react-router'
import { ArrowLeft, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useArticle } from '@/hooks/useArticle'

export function ArticleDetailPage() {
  const { id } = useParams()
  const { article, loading } = useArticle(Number(id))

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">加载中…</p>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20">
        <h1 className="text-xl font-semibold">文章不存在</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回列表
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回列表
          </Link>
        </Button>
      </div>

      <article>
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden="true" />
              {article.readTimeMinutes} 分钟阅读
            </span>
            <span>·</span>
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        <Separator className="mb-8" />

        <div className="space-y-5 text-[15px] leading-7 text-foreground/90">
          {article.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  )
}
