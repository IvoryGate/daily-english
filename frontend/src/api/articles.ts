import { mockArticles } from '@/lib/mockArticles'
import type { Article } from '@/types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchArticles(): Promise<Article[]> {
  await delay(300)
  return mockArticles
}

export async function fetchArticle(
  id: number,
): Promise<Article | undefined> {
  await delay(300)
  return mockArticles.find((article) => article.id === id)
}
