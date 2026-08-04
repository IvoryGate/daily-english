import { ArrowLeft, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Article } from '@/types'

interface ArticleDetailPageProps {
  article: Article
  onBack: () => void
}

export function ArticleDetailPage({ article, onBack }: ArticleDetailPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回列表
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article>
          <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              {article.title}
            </h1>
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
    </div>
  )
}
