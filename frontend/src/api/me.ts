import { getToken } from '@/api/auth'
import type { ReadingRecord, VocabEntry } from '@/types'

interface VocabDTO {
  word: string
  phonetic: string | null
  definition: string | null
  source_title: string
  added_at: string
  card: VocabEntry['card']
}

function toVocab(dto: VocabDTO): VocabEntry {
  return {
    word: dto.word,
    phonetic: dto.phonetic ?? undefined,
    definition: dto.definition ?? undefined,
    sourceTitle: dto.source_title,
    addedAt: dto.added_at,
    card: dto.card,
  }
}

interface ReadingDTO {
  article_id: number
  read_at: string
  progress: number
}

function toReading(dto: ReadingDTO): ReadingRecord {
  return { readAt: dto.read_at, progress: dto.progress }
}

export interface MeData {
  vocabulary: VocabEntry[]
  bookmarks: number[]
  reading: Record<number, ReadingRecord>
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('未登录')
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = (body as { detail?: string } | null)?.detail
    throw new Error(detail ?? `请求失败（${res.status}）`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function fetchMeData(): Promise<MeData> {
  const data = await request<{
    vocabulary: VocabDTO[]
    bookmarks: number[]
    reading: ReadingDTO[]
  }>('/api/me/data')
  const reading: Record<number, ReadingRecord> = {}
  for (const r of data.reading) reading[r.article_id] = toReading(r)
  return {
    vocabulary: data.vocabulary.map(toVocab),
    bookmarks: data.bookmarks,
    reading,
  }
}

export async function addVocabulary(input: {
  word: string
  phonetic?: string
  definition?: string
  sourceTitle: string
  card?: VocabEntry['card']
}): Promise<VocabEntry> {
  return toVocab(
    await request<VocabDTO>('/api/me/vocabulary', {
      method: 'POST',
      body: JSON.stringify({
        word: input.word,
        phonetic: input.phonetic,
        definition: input.definition,
        source_title: input.sourceTitle,
        card: input.card,
      }),
    }),
  )
}

export async function updateVocabulary(
  word: string,
  patch: Partial<Pick<VocabEntry, 'phonetic' | 'definition' | 'sourceTitle' | 'card'>>,
): Promise<VocabEntry> {
  return toVocab(
    await request<VocabDTO>(`/api/me/vocabulary/${encodeURIComponent(word)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        phonetic: patch.phonetic,
        definition: patch.definition,
        source_title: patch.sourceTitle,
        card: patch.card,
      }),
    }),
  )
}

export async function removeVocabulary(word: string): Promise<void> {
  await request<void>(`/api/me/vocabulary/${encodeURIComponent(word)}`, {
    method: 'DELETE',
  })
}

export async function addBookmark(articleId: number): Promise<void> {
  await request<void>(`/api/me/bookmarks/${articleId}`, { method: 'POST' })
}

export async function removeBookmark(articleId: number): Promise<void> {
  await request<void>(`/api/me/bookmarks/${articleId}`, { method: 'DELETE' })
}

export async function saveReading(
  articleId: number,
  input: { progress: number; readAt?: string },
): Promise<void> {
  await request<void>(`/api/me/reading/${articleId}`, {
    method: 'PUT',
    body: JSON.stringify({ progress: input.progress, read_at: input.readAt }),
  })
}

export async function clearMeData(): Promise<void> {
  await request<void>('/api/me/data', { method: 'DELETE' })
}

// ---- 学习激励（阶段 18） ----

export interface HeatmapDay {
  date: string
  reads: number
  reviews: number
}

export interface CurvePoint {
  date: string
  total: number
}

export interface TrendPoint {
  date: string
  count: number
}

export interface AchievementInfo {
  key: string
  name: string
  desc: string
  icon: string
  unlocked: boolean
}

export interface LevelInfo {
  level: number
  name: string
  hint: string
  points: number
  next_level_points: number | null
}

export interface TodayProgress {
  read_count: number
  review_count: number
  read_goal: number
  review_goal: number
  checked_in: boolean
}

export interface VocabEstimateLevel {
  level: string
  label: string
  total: number
  owned: number
}

export interface VocabEstimate {
  estimate: number
  per_level: VocabEstimateLevel[]
}

export interface StatsData {
  read_count: number
  vocab_count: number
  review_count: number
  bookmark_count: number
  points: number
  level: LevelInfo
  streak: number
  today: TodayProgress
  achievements: AchievementInfo[]
  heatmap: HeatmapDay[]
  vocabulary_curve: CurvePoint[]
  review_trend: TrendPoint[]
  mastered_vocab: number
  vocab_estimate: VocabEstimate
}

export async function fetchStats(): Promise<StatsData> {
  return request<StatsData>('/api/me/stats')
}

export async function fetchGoals(): Promise<{ read_goal: number; review_goal: number }> {
  return request<{ read_goal: number; review_goal: number }>('/api/me/goals')
}

export async function updateGoals(input: {
  read_goal: number
  review_goal: number
}): Promise<{ read_goal: number; review_goal: number }> {
  return request<{ read_goal: number; review_goal: number }>('/api/me/goals', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
