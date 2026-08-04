import { useEffect, useState } from 'react'
import { fetchArticle } from '@/api/articles'
import type { Article } from '@/types'

interface UseArticleResult {
  article: Article | null
  loading: boolean
}

export function useArticle(id: number | undefined): UseArticleResult {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id === undefined) return
    let active = true
    setLoading(true)
    fetchArticle(id)
      .then((data) => {
        if (active) setArticle(data ?? null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  return { article, loading }
}
