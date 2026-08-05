import type { Article } from '@/types'

/** 无图文章用 Picsum 免费摄影图兜底（seed 确定性：同标题永远同图） */
function fallbackImageUrl(article: Article): string {
  const seed = encodeURIComponent(`${article.title}-${article.id}`)
  return `https://picsum.photos/seed/${seed}/800/450`
}

/** 文章配图：有真实图用真实图，无图用 Picsum 免费摄影图兜底。 */
export function ArticleThumb({
  article,
  className,
}: {
  article: Article
  className?: string
}) {
  const src = article.imageUrl ?? fallbackImageUrl(article)
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`object-cover ${className ?? ''}`}
      onError={(e) => {
        // 图源加载失败时换 Picsum 兜底（真实图挂了也能出图）
        if (!e.currentTarget.dataset.fallback) {
          e.currentTarget.dataset.fallback = '1'
          e.currentTarget.src = fallbackImageUrl(article)
        }
      }}
    />
  )
}
