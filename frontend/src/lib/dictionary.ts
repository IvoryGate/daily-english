import { getDictCache, setDictCache } from '@/lib/storage'
import type { DictEntry, DictMeaning } from '@/types'

const API_BASE = '/api/dict/'

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, '')
}

interface DictMeaningDTO {
  partOfSpeech: string
  definitions: string[]
}

function parseEntries(data: {
  word: string
  phonetic_us?: string
  phonetic_uk?: string
  audio_us?: string
  audio_uk?: string
  meanings: DictMeaningDTO[]
}): DictEntry | null {
  const meanings: DictMeaning[] = []
  for (const m of data.meanings ?? []) {
    for (const def of m.definitions ?? []) {
      meanings.push({
        partOfSpeech: m.partOfSpeech ?? '',
        definition: def,
      })
      if (meanings.length >= 8) break
    }
    if (meanings.length >= 8) break
  }
  if (meanings.length === 0) return null
  return {
    word: data.word,
    phoneticUs: data.phonetic_us || undefined,
    phoneticUk: data.phonetic_uk || undefined,
    audioUs: data.audio_us || undefined,
    audioUk: data.audio_uk || undefined,
    meanings,
  }
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
