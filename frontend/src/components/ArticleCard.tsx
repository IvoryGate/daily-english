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
import { ArticleThumb } from '@/components/ArticleThumb'
import { useUserData } from '@/context/UserDataContext'
import { difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import { sourceLabel } from '@/lib/sourceLabels'
import type { Article } from '@/types'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { bookmarks, reading, toggleBookmark } = useUserData()
  const [bookmarked, setBookmarked] = useState(
    () => bookmarks.includes(article.id),
  )
  const read = Boolean(reading[article.id])

  const handleToggle = async () => {
    const added = await toggleBookmark(article.id)
    setBookmarked(added)
  }

  return (
    <Link to={`/articles/${article.id}`} className="relative block h-full">
      <Card
        size="sm"
        className="flex h-full flex-col overflow-hidden shadow-sm transition-all hover:border-primary/30 hover:bg-muted/30 hover:shadow-md"
      >
        <ArticleThumb
          article={article}
          className="aspect-[16/9] w-full"
        />
        <CardHeader>
          <CardTitle className="line-clamp-2 font-reading text-base font-bold leading-snug">
            {article.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {article.excerpt}
          </CardDescription>
        </CardHeader>
        <div className="mt-auto flex flex-wrap items-center gap-2 px-(--card-spacing) pt-1">
          {read && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            >
              <Check className="size-3" aria-hidden="true" />
              已读
            </Badge>
          )}
          <Badge className={difficultyStyles[article.difficulty]}>
            {difficultyLabels[article.difficulty]}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            {article.readTimeMinutes} 分钟
          </span>
          {article.source && article.source !== 'seed' && (
            <span className="text-xs text-muted-foreground">
              {sourceLabel(article.source)}
            </span>
          )}
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
          void handleToggle()
        }}
        className="absolute right-3 top-3 rounded-md bg-background/70 p-1.5 text-muted-foreground/60 backdrop-blur transition-colors hover:bg-accent hover:text-primary"
      >
        <Bookmark
          className={`size-4 ${bookmarked ? 'fill-primary text-primary' : ''}`}
          aria-hidden="true"
        />
      </button>
    </Link>
  )
}
