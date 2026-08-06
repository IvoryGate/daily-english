import { getLocalArticles } from '@/lib/storage'
import type { Article, ArticleSource, Difficulty } from '@/types'

export type SortKey = 'latest' | 'longest' | 'shortest'

export interface ArticleQuery {
  q?: string
  difficulty?: Difficulty | ''
  source?: ArticleSource | 'all'
  sort?: SortKey
}

interface ArticleSummaryDTO {
  id: number
  title: string
  excerpt: string
  difficulty: Difficulty
  tags: string[]
  read_time_minutes: number
  created_at: string
  source: string
  source_url: string | null
  image_url: string | null
  vocab_level?: string
  vocab_score?: number
}

interface ArticleDetailDTO extends ArticleSummaryDTO {
  content: string
}

function toArticle(dto: ArticleSummaryDTO & { content?: string }): Article {
  return {
    id: dto.id,
    title: dto.title,
    excerpt: dto.excerpt,
    difficulty: dto.difficulty,
    tags: dto.tags,
    readTimeMinutes: dto.read_time_minutes,
    createdAt: dto.created_at,
    content: dto.content,
    source: (dto.source as ArticleSource) ?? 'seed',
    sourceUrl: dto.source_url ?? undefined,
    imageUrl: dto.image_url ?? undefined,
    vocabLevel: dto.vocab_level,
    vocabScore: dto.vocab_score,
  }
}

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

function matches(article: Article, query: ArticleQuery): boolean {
  if (query.source && query.source !== 'all' && article.source !== query.source) {
    return false
  }
  if (query.difficulty && article.difficulty !== query.difficulty) {
    return false
  }
  if (query.q) {
    const needle = query.q.trim().toLowerCase()
    const haystack = [
      article.title,
      article.excerpt,
      article.content ?? '',
      article.tags.join(' '),
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  return true
}

function applySort(list: Article[], sort: SortKey): Article[] {
  const sorted = [...list]
  switch (sort) {
    case 'longest':
      return sorted.sort((a, b) => b.readTimeMinutes - a.readTimeMinutes)
    case 'shortest':
      return sorted.sort((a, b) => a.readTimeMinutes - b.readTimeMinutes)
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }
}

export async function fetchArticles(
  query: ArticleQuery = {},
): Promise<Article[]> {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.difficulty) params.set('difficulty', query.difficulty)
  const qs = params.toString()
  const url = qs ? `/api/articles?${qs}` : '/api/articles'
  const data = await request<ArticleSummaryDTO[]>(url)
  const server = data.map(toArticle)
  const local = getLocalArticles()
  const merged = [...server, ...local]
  return applySort(merged.filter((a) => matches(a, query)), query.sort ?? 'latest')
}

/** 按词汇画像拉文章：过滤指定词汇级别 + 按词汇分升序（最易在前）。 */
export async function fetchArticlesByVocab(
  vocabLevel: string,
): Promise<Article[]> {
  const url = `/api/articles?vocab_level=${encodeURIComponent(vocabLevel)}&sort=easiest`
  const data = await request<ArticleSummaryDTO[]>(url)
  return data.map(toArticle)
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
