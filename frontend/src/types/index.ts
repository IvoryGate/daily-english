export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Article {
  id: number
  title: string
  excerpt: string
  content?: string
  difficulty: Difficulty
  tags: string[]
  readTimeMinutes: number
  createdAt: string
  /** 来源：内置/后端文章（默认），或本地用户添加的文章 */
  source?: 'server' | 'local'
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
