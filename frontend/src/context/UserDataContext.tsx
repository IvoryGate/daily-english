import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  addBookmark,
  addVocabulary as cloudAddVocabulary,
  fetchMeData,
  removeBookmark,
  removeVocabulary as cloudRemoveVocabulary,
  saveReading,
  updateVocabulary as cloudUpdateVocabulary,
} from '@/api/me'
import {
  addVocabulary as localAddVocabulary,
  clearLocalUserData,
  getBookmarks,
  getReadingHistory,
  getVocabulary,
  removeVocabulary as localRemoveVocabulary,
  toggleBookmark as localToggleBookmark,
  updateVocabulary as localUpdateVocabulary,
  markRead as localMarkRead,
  saveProgress as localSaveProgress,
} from '@/lib/storage'
import { newCard } from '@/lib/fsrs'
import type { ReadingRecord, VocabEntry } from '@/types'

export interface ImportResult {
  imported: number
  skipped: number
}

interface UserDataValue {
  vocabulary: VocabEntry[]
  bookmarks: number[]
  reading: Record<number, ReadingRecord>
  loading: boolean
  online: boolean
  migrated: boolean
  addVocabulary: (input: {
    word: string
    phonetic?: string
    definition?: string
    sourceTitle: string
  }) => Promise<void>
  updateVocabulary: (
    word: string,
    patch: Partial<VocabEntry>,
  ) => Promise<void>
  removeVocabulary: (word: string) => Promise<void>
  toggleBookmark: (id: number) => Promise<boolean>
  markRead: (id: number) => Promise<void>
  saveProgress: (id: number, progress: number) => Promise<void>
  importVocabulary: (raw: string) => Promise<ImportResult>
}

const UserDataContext = createContext<UserDataValue | null>(null)

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const online = Boolean(user)

  const [vocabulary, setVocabulary] = useState<VocabEntry[]>([])
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [reading, setReading] = useState<Record<number, ReadingRecord>>({})
  const [loading, setLoading] = useState(true)
  const [migrated, setMigrated] = useState(false)
  const migratedRef = useRef(false)

  // 登录状态变化：拉云端数据；未登录直接读本地。
  // 等待 auth 恢复完成（authLoading=false）后再决定数据源，避免误读空 localStorage。
  useEffect(() => {
    let active = true

    if (authLoading) return

    if (!online) {
      setVocabulary(getVocabulary())
      setBookmarks(getBookmarks())
      setReading(getReadingHistory())
      setLoading(false)
      migratedRef.current = false
      return
    }

    setLoading(true)
    const run = async () => {
      let data = await fetchMeData()
      // 首次登录：把本地旧数据迁移到云端（只迁移缺失项，避免覆盖云端）
      if (!migratedRef.current) {
        migratedRef.current = true
        const migratedAny = await migrateLocalToCloud(data)
        if (migratedAny) {
          setMigrated(true)
          data = await fetchMeData()
        }
      }
      if (!active) return
      setVocabulary(data.vocabulary)
      setBookmarks(data.bookmarks)
      setReading(data.reading)
      setLoading(false)
    }
    run().catch(() => {
      if (!active) return
      setVocabulary([])
      setBookmarks([])
      setReading({})
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [authLoading, online])

  // ---- 迁移：本地数据推送到云端，成功后清空本地 ----

  const migrateLocalToCloud = async (data: Awaited<ReturnType<typeof fetchMeData>>) => {
    const localVocab = getVocabulary()
    const localBookmarks = getBookmarks()
    const localReading = getReadingHistory()

    const cloudWords = new Set(data.vocabulary.map((w) => w.word))
    const cloudBookmarks = new Set(data.bookmarks)
    const cloudReading = new Set(Object.keys(data.reading).map(Number))

    let any = false

    for (const entry of localVocab) {
      if (cloudWords.has(entry.word)) continue
      await cloudAddVocabulary({
        word: entry.word,
        phonetic: entry.phonetic,
        definition: entry.definition,
        sourceTitle: entry.sourceTitle,
        card: entry.card,
      })
      any = true
    }

    for (const id of localBookmarks) {
      if (cloudBookmarks.has(id)) continue
      await addBookmark(id)
      any = true
    }

    for (const [idStr, record] of Object.entries(localReading)) {
      const id = Number(idStr)
      if (cloudReading.has(id)) continue
      await saveReading(id, { progress: record.progress, readAt: record.readAt })
      any = true
    }

    if (any) clearLocalUserData()
    return any
  }

  // ---- 生词 ----

  const addVocabulary = useCallback(
    async (input: {
      word: string
      phonetic?: string
      definition?: string
      sourceTitle: string
    }) => {
      if (online) {
        const created = await cloudAddVocabulary({
          ...input,
          card: newCard(),
        })
        setVocabulary((prev) => [
          { ...created },
          ...prev.filter((w) => w.word !== created.word),
        ])
      } else {
        localAddVocabulary(input)
        setVocabulary(getVocabulary())
      }
    },
    [online],
  )

  const updateVocabulary = useCallback(
    async (word: string, patch: Partial<VocabEntry>) => {
      if (online) {
        const updated = await cloudUpdateVocabulary(word, {
          phonetic: patch.phonetic,
          definition: patch.definition,
          sourceTitle: patch.sourceTitle,
          card: patch.card,
        })
        setVocabulary((prev) =>
          prev.map((w) => (w.word === word ? { ...updated } : w)),
        )
      } else {
        localUpdateVocabulary(word, patch)
        setVocabulary(getVocabulary())
      }
    },
    [online],
  )

  const removeVocabulary = useCallback(
    async (word: string) => {
      if (online) {
        await cloudRemoveVocabulary(word)
        setVocabulary((prev) => prev.filter((w) => w.word !== word))
      } else {
        localRemoveVocabulary(word)
        setVocabulary(getVocabulary())
      }
    },
    [online],
  )

  // ---- 收藏 ----

  const toggleBookmark = useCallback(
    async (id: number): Promise<boolean> => {
      let added: boolean
      if (online) {
        const has = bookmarks.includes(id)
        if (has) {
          await removeBookmark(id)
          added = false
        } else {
          await addBookmark(id)
          added = true
        }
        setBookmarks((prev) =>
          added ? [id, ...prev] : prev.filter((b) => b !== id),
        )
      } else {
        added = localToggleBookmark(id)
        setBookmarks(getBookmarks())
      }
      return added
    },
    [online, bookmarks],
  )

  // ---- 阅读记录 ----

  const markRead = useCallback(
    async (id: number) => {
      if (online) {
        const prev = reading[id]
        await saveReading(id, {
          progress: prev?.progress ?? 0,
          readAt: prev?.readAt,
        })
        setReading((r) => ({
          ...r,
          [id]: { readAt: prev?.readAt ?? new Date().toISOString(), progress: prev?.progress ?? 0 },
        }))
      } else {
        localMarkRead(id)
        setReading(getReadingHistory())
      }
    },
    [online, reading],
  )

  const saveProgress = useCallback(
    async (id: number, progress: number) => {
      if (online) {
        const prev = reading[id]
        const readAt = prev?.readAt ?? new Date().toISOString()
        await saveReading(id, { progress, readAt })
        setReading((r) => ({ ...r, [id]: { readAt, progress } }))
      } else {
        localSaveProgress(id, progress)
        setReading(getReadingHistory())
      }
    },
    [online, reading],
  )

  // ---- 生词导入（本地 JSON） ----

  const importVocabulary = useCallback(
    async (raw: string): Promise<ImportResult> => {
      let data: unknown
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error('不是有效的 JSON 文件')
      }
      if (!Array.isArray(data)) {
        throw new Error('生词本文件格式不对，应是一个数组')
      }

      let imported = 0
      let skipped = 0
      for (const item of data as Array<Record<string, unknown>>) {
        const word = item?.word
        if (typeof word !== 'string' || !word) {
          skipped += 1
          continue
        }
        if (vocabulary.some((w) => w.word === word)) {
          skipped += 1
          continue
        }
        if (online) {
          await cloudAddVocabulary({
            word,
            phonetic: typeof item.phonetic === 'string' ? item.phonetic : undefined,
            definition:
              typeof item.definition === 'string' ? item.definition : undefined,
            sourceTitle:
              typeof item.sourceTitle === 'string' ? item.sourceTitle : '',
            card:
              item.card && typeof item.card === 'object'
                ? (item.card as VocabEntry['card'])
                : newCard(),
          })
        } else {
          localAddVocabulary({
            word,
            phonetic: typeof item.phonetic === 'string' ? item.phonetic : undefined,
            definition:
              typeof item.definition === 'string' ? item.definition : undefined,
            sourceTitle:
              typeof item.sourceTitle === 'string' ? item.sourceTitle : '',
          })
        }
        imported += 1
      }
      if (online) {
        const data = await fetchMeData()
        setVocabulary(data.vocabulary)
      } else {
        setVocabulary(getVocabulary())
      }
      return { imported, skipped }
    },
    [online, vocabulary],
  )

  return (
    <UserDataContext.Provider
      value={{
        vocabulary,
        bookmarks,
        reading,
        loading,
        online,
        migrated,
        addVocabulary,
        updateVocabulary,
        removeVocabulary,
        toggleBookmark,
        markRead,
        saveProgress,
        importVocabulary,
      }}
    >
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData(): UserDataValue {
  const ctx = useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData 必须在 UserDataProvider 内使用')
  return ctx
}
