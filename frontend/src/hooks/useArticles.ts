import { useCallback, useEffect, useState } from 'react'
import { fetchArticles, type ArticleQuery } from '@/api/articles'
import type { Article } from '@/types'

interface UseArticlesResult {
  articles: Article[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useArticles(query?: ArticleQuery): UseArticlesResult {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const queryKey = JSON.stringify(query ?? {})

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetchArticles(JSON.parse(queryKey))
      .then((data) => {
        if (active) setArticles(data)
      })
      .catch(() => {
        if (active) setError('加载失败，请稍后重试')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [queryKey, version])

  const refresh = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  return { articles, loading, error, refresh }
}
