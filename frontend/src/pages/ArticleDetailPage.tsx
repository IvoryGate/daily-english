import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Clock, Trash2 } from 'lucide-react'
import { ArticleReader } from '@/components/ArticleReader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useArticle } from '@/hooks/useArticle'
import { difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import { deleteLocalArticle } from '@/lib/storage'

export function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回列表
          </Link>
        </Button>
        {article.source === 'local' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              deleteLocalArticle(article.id)
              navigate('/')
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            删除文章
          </Button>
        )}
      </div>

      <article>
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className={difficultyStyles[article.difficulty]}>
              {difficultyLabels[article.difficulty]}
            </Badge>
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

        <ArticleReader content={article.content ?? ''} sourceTitle={article.title} />
      </article>
    </main>
  )
}
