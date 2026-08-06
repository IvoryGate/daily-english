/** 学习路径：词汇级别展示 + 用户等级→推荐词汇区间映射。 */

/** 词汇级别（低→高），与后端 word_lists 一致 */
export const VOCAB_LEVELS = [
  'junior',
  'senior',
  'cet4',
  'cet6',
  'ielts',
  'toefl',
  'tem8',
  'advanced',
] as const

export type VocabLevel = (typeof VOCAB_LEVELS)[number]

export const VOCAB_LABELS: Record<VocabLevel, string> = {
  junior: '初中',
  senior: '高中',
  cet4: '四级',
  cet6: '六级',
  ielts: '雅思',
  toefl: '托福',
  tem8: '专八',
  advanced: '超纲',
}

/** 用户等级(Lv1~5) → 建议的词汇级别区间（不含过难/过易） */
export function vocabRangeForLevel(level: number): VocabLevel[] {
  if (level <= 1) return ['junior', 'senior']
  if (level === 2) return ['senior', 'cet4']
  if (level === 3) return ['cet4', 'cet6']
  if (level === 4) return ['ielts', 'toefl']
  return ['toefl', 'tem8', 'advanced']
}

/** 用户等级 → 词汇容错上限（最多读到哪个级别） */
export function maxVocabForLevel(level: number): VocabLevel {
  if (level <= 1) return 'senior'
  if (level === 2) return 'cet4'
  if (level === 3) return 'cet6'
  if (level === 4) return 'toefl'
  return 'advanced'
}

export function vocabLabel(level: string): string {
  return VOCAB_LABELS[level as VocabLevel] ?? level
}