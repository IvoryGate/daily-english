import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, LoaderCircle, Volume2 } from 'lucide-react'
import { useUserData } from '@/context/UserDataContext'
import { lookupWord } from '@/lib/dictionary'
import { speak } from '@/lib/speech'
import type { DictEntry } from '@/types'

/** 重点词轮播卡片组：每个词一张卡（美英音标+发音+释义+收藏），左右箭头滑动。 */
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
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          本文章重点词 · 预习卡片 {index + 1}/{words.length}
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

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {words.map((word) => (
            <div key={word} className="w-full shrink-0 px-0.5">
              <KeywordCard word={word} sourceTitle={sourceTitle} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KeywordCard({ word, sourceTitle }: { word: string; sourceTitle: string }) {
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

  const handleSpeak = () => {
    const audio = entry?.audioUs ?? entry?.audioUk
    if (audio) {
      new Audio(audio).play().catch(() => speak(word))
    } else {
      speak(word)
    }
  }

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
    <div className="rounded-xl border border-primary/15 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-reading text-lg font-bold">{word}</h3>
            <button
              type="button"
              onClick={handleSpeak}
              className="flex cursor-pointer items-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={`朗读 ${word}`}
              title="朗读发音"
            >
              <Volume2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          {(entry?.phoneticUs || entry?.phoneticUk) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className="mr-1.5">美 {entry?.phoneticUs}</span>
              {entry?.phoneticUk && <span>英 {entry?.phoneticUk}</span>}
            </p>
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
          {saved ? '已收藏' : '收藏生词'}
        </button>
      </div>

      <div className="mt-3">
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
            {entry.meanings.slice(0, 3).map((m, i) => (
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
