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

/** 用户等级(Lv1~5) → 建议阅读难度 */
export function difficultyForLevel(level: number): Difficulty[] {
  if (level <= 2) return ['beginner']
  if (level === 3) return ['beginner', 'intermediate']
  if (level === 4) return ['intermediate', 'advanced']
  return ['advanced']
}
