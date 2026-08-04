export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

/** 文章来源：内置语料 / 外部刊物（VOA/卫报/大西洋等）/ 本地粘贴 */
export type ArticleSource =
  | 'seed'
  | 'voa'
  | 'guardian'
  | 'atlantic'
  | 'local'

export interface Article {
  id: number
  title: string
  excerpt: string
  content?: string
  difficulty: Difficulty
  tags: string[]
  readTimeMinutes: number
  createdAt: string
  /** 文章来源 */
  source?: ArticleSource
  /** 原文链接（爬取的文章） */
  sourceUrl?: string
}

export interface VocabEntry {
  word: string
  phonetic?: string
  definition?: string
  sourceTitle: string
  addedAt: string
  /** FSRS 复习调度卡片数据 */
  card: FSRSCardData
}

/** FSRS 卡片（序列化自 ts-fsrs 的 Card，date 用 ISO 字符串） */
export interface FSRSCardData {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review: string | null
}

export interface DictMeaning {
  partOfSpeech: string
  definition: string
  example?: string
}

export interface DictEntry {
  word: string
  phonetic?: string
  meanings: DictMeaning[]
}
