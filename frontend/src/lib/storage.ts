import type { Article, DictEntry, VocabEntry } from '@/types'

const KEYS = {
  localArticles: 'de.localArticles.v1',
  vocabulary: 'de.vocabulary.v1',
  dictCache: 'de.dictCache.v1',
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
  return read<VocabEntry[]>(KEYS.vocabulary, [])
}

export function addVocabulary(entry: VocabEntry): void {
  const words = getVocabulary()
  if (words.some((w) => w.word === entry.word)) return
  words.unshift(entry)
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

// ---- 词典缓存（查过的词离线可读，减少重复请求） ----

export function getDictCache(): Record<string, DictEntry> {
  return read<Record<string, DictEntry>>(KEYS.dictCache, {})
}

export function setDictCache(word: string, entry: DictEntry): void {
  const cache = getDictCache()
  cache[word] = entry
  write(KEYS.dictCache, cache)
}
