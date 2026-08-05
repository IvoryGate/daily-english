/** 翻译 API：整篇批量翻译（1 次往返）。 */

export async function translateBatch(texts: string[]): Promise<string[]> {
  const clean = texts.map((t) => t.trim()).filter(Boolean)
  if (clean.length === 0) return []
  const res = await fetch('/api/dict/translate-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: clean }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { translations: string[] }
  // 结果对齐：过滤掉的空段需要补回位置
  let idx = 0
  return texts.map((t) => {
    if (!t.trim()) return ''
    const result = data.translations[idx]
    idx += 1
    return result ?? ''
  })
}
