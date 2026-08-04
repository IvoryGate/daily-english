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
  /** 简单间隔复习：0 新词 / 1 学习中 / 2 已掌握 */
  stage: number
  /** 到期复习时间（ISO） */
  nextReviewAt: string
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
