import { getDictCache, setDictCache } from '@/lib/storage'
import type { DictEntry, DictMeaning } from '@/types'

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, '')
}

function parseEntries(data: unknown): DictEntry | null {
  if (!Array.isArray(data) || data.length === 0) return null
  const first = data[0] as Record<string, unknown>
  const word = String(first.word ?? '')
  const phonetics = Array.isArray(first.phonetics) ? first.phonetics : []
  const phonetic =
    (first.phonetic as string | undefined) ??
    (phonetics[0] as { text?: string } | undefined)?.text

  const meanings: DictMeaning[] = []
  for (const m of Array.isArray(first.meanings) ? first.meanings : []) {
    const mObj = m as {
      partOfSpeech?: string
      definitions?: { definition?: string; example?: string }[]
    }
    for (const d of mObj.definitions ?? []) {
      meanings.push({
        partOfSpeech: mObj.partOfSpeech ?? '',
        definition: d.definition ?? '',
        example: d.example,
      })
      if (meanings.length >= 3) break
    }
    if (meanings.length >= 3) break
  }

  return { word, phonetic, meanings }
}

export async function lookupWord(word: string): Promise<DictEntry | null> {
  const key = normalize(word)
  if (!key) return null

  const cache = getDictCache()
  if (cache[key]) return cache[key]

  try {
    const res = await fetch(`${API_BASE}${encodeURIComponent(key)}`)
    if (!res.ok) return null
    const entry = parseEntries(await res.json())
    if (entry) setDictCache(key, entry)
    return entry
  } catch {
    return null
  }
}
