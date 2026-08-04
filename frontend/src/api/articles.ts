import { getLocalArticles } from '@/lib/storage'
import type { Article, Difficulty } from '@/types'

interface ArticleSummaryDTO {
  id: number
  title: string
  excerpt: string
  difficulty: Difficulty
  tags: string[]
  read_time_minutes: number
  created_at: string
}

interface ArticleDetailDTO extends ArticleSummaryDTO {
  content: string
}

function toArticle(dto: ArticleSummaryDTO): Article {
  return {
    id: dto.id,
    title: dto.title,
    excerpt: dto.excerpt,
    difficulty: dto.difficulty,
    tags: dto.tags,
    readTimeMinutes: dto.read_time_minutes,
    createdAt: dto.created_at,
  }
}

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export async function fetchArticles(): Promise<Article[]> {
  const data = await request<ArticleSummaryDTO[]>('/api/articles')
  const server = data.map(toArticle)
  const local = getLocalArticles()
  return [...server, ...local]
}

export async function fetchArticle(id: number): Promise<Article | undefined> {
  if (id < 0) {
    return getLocalArticles().find((a) => a.id === id)
  }
  const res = await fetch(`/api/articles/${id}`)
  if (res.status === 404) return undefined
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const data = (await res.json()) as ArticleDetailDTO
  return toArticle(data)
}
