import type { Article, DictEntry, VocabEntry } from '@/types'
import { newCard } from '@/lib/fsrs'

const KEYS = {
  localArticles: 'de.localArticles.v1',
  vocabulary: 'de.vocabulary.v1',
  dictCache: 'de.dictCache.v1',
  readingHistory: 'de.readingHistory.v1',
  bookmarks: 'de.bookmarks.v1',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage 不可用（如隐私模式）时静默失败
  }
}

// ---- 本地文章（自我精读） ----

export function getLocalArticles(): Article[] {
  return read<Article[]>(KEYS.localArticles, [])
}

export function addLocalArticle(input: {
  title: string
  content: string
  difficulty: Article['difficulty']
  tags: string[]
}): void {
  const articles = getLocalArticles()
  const id = -(Date.now())
  const excerpt = input.content
    .split('\n\n')
    .join(' ')
    .slice(0, 120)
  const wordsPerMinute = 200
  const readTimeMinutes = Math.max(
    1,
    Math.round(input.content.split(/\s+/).length / wordsPerMinute),
  )
  articles.unshift({
    id,
    title: input.title,
    excerpt,
    content: input.content,
    difficulty: input.difficulty,
    tags: input.tags,
    readTimeMinutes,
    createdAt: new Date().toISOString(),
    source: 'local',
  })
  write(KEYS.localArticles, articles)
}

export function deleteLocalArticle(id: number): void {
  write(
    KEYS.localArticles,
    getLocalArticles().filter((a) => a.id !== id),
  )
}

// ---- 生词本 ----

export function getVocabulary(): VocabEntry[] {
  return read<VocabEntry[]>(KEYS.vocabulary, []).map(migrateEntry)
}

interface LegacyVocab {
  word: string
  phonetic?: string
  definition?: string
  sourceTitle?: string
  addedAt?: string
  stage?: number
  nextReviewAt?: string
  card?: VocabEntry['card']
}

function migrateEntry(entry: LegacyVocab): VocabEntry {
  if (entry.card) {
    return {
      word: entry.word,
      phonetic: entry.phonetic,
      definition: entry.definition,
      sourceTitle: entry.sourceTitle ?? '',
      addedAt: entry.addedAt ?? new Date().toISOString(),
      card: entry.card,
    }
  }
  const card = newCard()
  if (entry.nextReviewAt) card.due = entry.nextReviewAt
  return {
    word: entry.word,
    phonetic: entry.phonetic,
    definition: entry.definition,
    sourceTitle: entry.sourceTitle ?? '',
    addedAt: entry.addedAt ?? new Date().toISOString(),
    card,
  }
}

export function addVocabulary(input: {
  word: string
  phonetic?: string
  definition?: string
  sourceTitle: string
}): void {
  const words = getVocabulary()
  if (words.some((w) => w.word === input.word)) return
  words.unshift({
    ...input,
    addedAt: new Date().toISOString(),
    card: newCard(),
  })
  write(KEYS.vocabulary, words)
}

export function updateVocabulary(
  word: string,
  patch: Partial<VocabEntry>,
): void {
  write(
    KEYS.vocabulary,
    getVocabulary().map((w) => (w.word === word ? { ...w, ...patch } : w)),
  )
}

export function removeVocabulary(word: string): void {
  write(
    KEYS.vocabulary,
    getVocabulary().filter((w) => w.word !== word),
  )
}

// ---- 阅读记录（已读标记 + 阅读进度） ----

export interface ReadingRecord {
  readAt: string
  progress: number
}

export function getReadingHistory(): Record<number, ReadingRecord> {
  return read<Record<number, ReadingRecord>>(KEYS.readingHistory, {})
}

export function markRead(id: number): void {
  const history = getReadingHistory()
  const prev = history[id]
  history[id] = {
    readAt: prev?.readAt ?? new Date().toISOString(),
    progress: prev?.progress ?? 0,
  }
  write(KEYS.readingHistory, history)
}

export function saveProgress(id: number, progress: number): void {
  const history = getReadingHistory()
  const prev = history[id]
  history[id] = {
    readAt: prev?.readAt ?? new Date().toISOString(),
    progress,
  }
  write(KEYS.readingHistory, history)
}

export function isRead(id: number): boolean {
  return Boolean(getReadingHistory()[id])
}

// ---- 收藏 / 稍后读 ----

export function getBookmarks(): number[] {
  return read<number[]>(KEYS.bookmarks, [])
}

export function isBookmarked(id: number): boolean {
  return getBookmarks().includes(id)
}

export function toggleBookmark(id: number): boolean {
  const bookmarks = getBookmarks()
  const index = bookmarks.indexOf(id)
  if (index >= 0) {
    bookmarks.splice(index, 1)
  } else {
    bookmarks.unshift(id)
  }
  write(KEYS.bookmarks, bookmarks)
  return index < 0
}

// ---- 词典缓存（查过的词离线可读，减少重复请求） ----

export function getDictCache(): Record<string, DictEntry> {
  return read<Record<string, DictEntry>>(KEYS.dictCache, {})
}

export function setDictCache(word: string, entry: DictEntry): void {
  const cache = getDictCache()
  cache[word] = entry
  write(KEYS.dictCache, cache)
}
