import { useEffect, useState } from 'react'
import { fetchArticles } from '@/api/articles'
import type { Article } from '@/types'

interface UseArticlesResult {
  articles: Article[]
  loading: boolean
  error: string | null
}

export function useArticles(): UseArticlesResult {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchArticles()
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
  }, [])

  return { articles, loading, error }
}
