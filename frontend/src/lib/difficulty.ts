import type { Difficulty } from '@/types'

export const difficultyStyles: Record<Difficulty, string> = {
  beginner: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  intermediate: 'bg-amber-600/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  advanced: 'bg-rose-600/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
}

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '挑战',
}
