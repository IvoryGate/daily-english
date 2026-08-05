const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'of', 'at',
  'by', 'for', 'from', 'in', 'into', 'on', 'to', 'with', 'as', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must',
  'shall', 'not', 'no', 'nor', 'so', 'very', 'too', 'just', 'also', 'about',
  'over', 'under', 'up', 'down', 'out', 'off', 'again', 'there', 'here',
  'this', 'that', 'these', 'those', 'it', 'its', 'i', 'you', 'he', 'she',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
  'their', 'our', 'what', 'which', 'who', 'whom', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'than', 'then', 'because', 'before',
  'after', 'between', 'during', 'through', 'among', 'within', 'without',
  'does', 'doing', 'done', 'been', 'being', 'got', 'get', 'gets', 'getting',
  'make', 'makes', 'made', 'making', 'say', 'says', 'said', 'see', 'saw',
  'seen', 'know', 'knows', 'knew', 'new', 'now', 'one', 'two', 'like',
  'even', 'ever', 'never', 'always', 'often', 'usually', 'sometimes',
])

/** 从文章正文提取高频实词（≥5 字符、非停用词），返回按频率排序的词。 */
export function extractKeywords(content: string, limit = 8): string[] {
  const counts = new Map<string, number>()
  const matches = content.toLowerCase().match(/[a-z][a-z'-]{4,}/g)
  if (!matches) return []
  for (const raw of matches) {
    const word = raw.replace(/^['-]+|['-]+$/g, '')
    if (word.length < 5 || STOP_WORDS.has(word)) continue
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word)
}
