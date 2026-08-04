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
}
