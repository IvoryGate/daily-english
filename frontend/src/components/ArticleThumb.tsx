import type { Article } from '@/types'

const GRADIENTS = [
  'from-rose-500/20 via-orange-400/10 to-amber-300/10',
  'from-sky-500/20 via-indigo-400/10 to-violet-300/10',
  'from-emerald-500/20 via-teal-400/10 to-cyan-300/10',
  'from-primary/25 via-primary/10 to-accent/10',
]

function gradientFor(id: number): string {
  return GRADIENTS[Math.abs(id) % GRADIENTS.length]
}

/** 文章配图：有图显示图，无图用标题首字母 + 渐变兜底。 */
export function ArticleThumb({
  article,
  className,
}: {
  article: Article
  className?: string
}) {
  if (article.imageUrl) {
    return (
      <img
        src={article.imageUrl}
        alt=""
        loading="lazy"
        className={`object-cover ${className ?? ''}`}
        onError={(e) => {
          // 图片加载失败时隐藏，露出底下的渐变兜底
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }
  const letter = (article.title.trim()[0] ?? 'A').toUpperCase()
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(article.id)} ${className ?? ''}`}
      aria-hidden="true"
    >
      <span className="font-reading text-3xl font-bold text-foreground/30">
        {letter}
      </span>
    </div>
  )
}
