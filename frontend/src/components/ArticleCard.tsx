import { useState } from 'react'
import { Link } from 'react-router'
import { Bookmark, Check, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import { sourceLabel } from '@/lib/sourceLabels'
import { getBookmarks, getReadingHistory, toggleBookmark } from '@/lib/storage'
import type { Article } from '@/types'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [bookmarked, setBookmarked] = useState(() =>
    getBookmarks().includes(article.id),
  )
  const read = Boolean(getReadingHistory()[article.id])

  return (
    <Link to={`/articles/${article.id}`} className="relative block">
      <Card
        size="sm"
        className="transition-colors hover:bg-muted/40"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {article.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {article.excerpt}
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-2 px-(--card-spacing) pt-1">
          {read && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            >
              <Check className="size-3" aria-hidden="true" />
              已读
            </Badge>
          )}
          {article.source && article.source !== 'seed' && (
            <Badge
              variant="outline"
              className={
                article.source === 'local'
                  ? 'border-primary/30 text-primary'
                  : 'border-primary/40 text-primary'
              }
            >
              {sourceLabel(article.source)}
            </Badge>
          )}
          <Badge className={difficultyStyles[article.difficulty]}>
            {difficultyLabels[article.difficulty]}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            {article.readTimeMinutes} 分钟
          </span>
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="pt-2" />
      </Card>
      <button
        type="button"
        aria-label={bookmarked ? '取消收藏' : '收藏文章'}
        aria-pressed={bookmarked}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setBookmarked(toggleBookmark(article.id))
        }}
        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-primary"
      >
        <Bookmark
          className={`size-4 ${bookmarked ? 'fill-primary text-primary' : ''}`}
          aria-hidden="true"
        />
      </button>
    </Link>
  )
}
