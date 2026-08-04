import { Link } from 'react-router'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import type { Article } from '@/types'

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.id}`} className="block">
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
    </Link>
  )
}
