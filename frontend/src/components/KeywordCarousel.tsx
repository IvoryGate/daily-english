import { useEffect, useState } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react'
import { useUserData } from '@/context/UserDataContext'
import { lookupWord } from '@/lib/dictionary'
import { SpeakButtons } from '@/components/SpeakButtons'
import type { DictEntry } from '@/types'

/** 重点词轮播：固定高度横向滑卡，每个词一页（美英音标+发音+释义+收藏）。 */
export function KeywordCarousel({
  words,
  sourceTitle,
}: {
  words: string[]
  sourceTitle: string
}) {
  const [index, setIndex] = useState(0)
  const maxIndex = Math.max(0, words.length - 1)

  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => setIndex((i) => Math.min(maxIndex, i + 1))

  if (words.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          本文章重点词 · {index + 1}/{words.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:cursor-default disabled:opacity-30"
            aria-label="上一个重点词"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index === maxIndex}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:cursor-default disabled:opacity-30"
            aria-label="下一个重点词"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 固定高度容器：所有页等高，内容超出滚动 */}
      <div className="relative h-44 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {words.map((word) => (
            <div key={word} className="h-full w-full shrink-0 overflow-hidden">
              <KeywordView word={word} sourceTitle={sourceTitle} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KeywordView({ word, sourceTitle }: { word: string; sourceTitle: string }) {
  const { vocabulary, addVocabulary, removeVocabulary } = useUserData()
  const [entry, setEntry] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const saved = vocabulary.some((w) => w.word === word.toLowerCase())

  useEffect(() => {
    let active = true
    setLoading(true)
    lookupWord(word)
      .then((result) => {
        if (active) setEntry(result)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [word])

  const toggleSave = async () => {
    if (saved) {
      await removeVocabulary(word.toLowerCase())
    } else {
      await addVocabulary({
        word: word.toLowerCase(),
        phonetic: entry?.phoneticUs ?? entry?.phoneticUk,
        definition: entry?.meanings[0]?.definition,
        sourceTitle,
      })
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3 className="shrink-0 font-reading text-xl font-bold">{word}</h3>
          {!loading && (
            <SpeakButtons
              word={word}
              audioUs={entry?.audioUs}
              audioUk={entry?.audioUk}
              size="sm"
            />
          )}
          {!loading && (entry?.phoneticUs || entry?.phoneticUk) && (
            <span className="truncate text-xs text-muted-foreground">
              美 {entry?.phoneticUs}
              {entry?.phoneticUk && <span className="ml-1.5">英 {entry?.phoneticUk}</span>}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void toggleSave()}
          disabled={saved}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent disabled:cursor-default"
          aria-pressed={saved}
        >
          {saved ? (
            <BookmarkCheck className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <Bookmark className="size-4" aria-hidden="true" />
          )}
          {saved ? '已收藏' : '收藏'}
        </button>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-border/60 pt-3">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            加载释义…
          </p>
        )}
        {!loading && entry === null && (
          <p className="text-sm text-muted-foreground">暂无释义</p>
        )}
        {!loading && entry && (
          <ul className="space-y-2">
            {entry.meanings.slice(0, 5).map((m, i) => (
              <li key={i} className="text-sm leading-6">
                <span className="mr-1.5 italic text-muted-foreground">
                  {m.partOfSpeech}
                </span>
                {m.definition}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
