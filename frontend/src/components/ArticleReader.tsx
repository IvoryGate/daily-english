import { useCallback, useEffect, useRef, useState } from 'react'
import { Bookmark, BookmarkCheck, LoaderCircle } from 'lucide-react'
import { lookupWord } from '@/lib/dictionary'
import {
  addVocabulary,
  getVocabulary,
  removeVocabulary,
} from '@/lib/storage'
import type { DictEntry } from '@/types'

interface Token {
  text: string
  isWord: boolean
}

function tokenize(text: string): Token[] {
  return text
    .split(/([A-Za-z][A-Za-z'-]*)/g)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      isWord: /^[A-Za-z][A-Za-z'-]*$/.test(part),
    }))
}

interface ActiveWord {
  word: string
  x: number
  y: number
}

interface ArticleReaderProps {
  content: string
  sourceTitle: string
}

export function ArticleReader({ content, sourceTitle }: ArticleReaderProps) {
  const [active, setActive] = useState<ActiveWord | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleWordClick = useCallback(
    (event: React.MouseEvent, word: string) => {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      setActive({ word, x: rect.left, y: rect.bottom + 6 })
    },
    [],
  )

  useEffect(() => {
    if (!active) return
    const onScroll = () => setActive(null)
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [active])

  const paragraphs = content.split('\n\n')

  return (
    <div ref={containerRef}>
      <div className="space-y-5 text-[15px] leading-7 text-foreground/90">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>
            {tokenize(paragraph).map((token, i) =>
              token.isWord ? (
                <button
                  key={i}
                  type="button"
                  className="cursor-pointer rounded-sm px-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={(event) => handleWordClick(event, token.text)}
                >
                  {token.text}
                </button>
              ) : (
                <span key={i}>{token.text}</span>
              ),
            )}
          </p>
        ))}
      </div>

      {active && (
        <WordPanel
          word={active.word}
          x={active.x}
          y={active.y}
          sourceTitle={sourceTitle}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  )
}

interface WordPanelProps {
  word: string
  x: number
  y: number
  sourceTitle: string
  onClose: () => void
}

function WordPanel({ word, x, y, sourceTitle, onClose }: WordPanelProps) {
  const [entry, setEntry] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(() =>
    getVocabulary().some((w) => w.word === word.toLowerCase()),
  )

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

  const toggleSave = () => {
    if (saved) {
      removeVocabulary(word.toLowerCase())
      setSaved(false)
    } else {
      addVocabulary({
        word: word.toLowerCase(),
        phonetic: entry?.phonetic,
        definition: entry?.meanings[0]?.definition,
        sourceTitle,
      })
      setSaved(true)
    }
  }

  const clampedX = Math.min(Math.max(x, 12), window.innerWidth - 320)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[300px] rounded-xl border bg-card p-4 text-card-foreground shadow-lg"
        style={{ top: y, left: clampedX }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{word}</h3>
            {entry?.phonetic && (
              <p className="text-xs text-muted-foreground">{entry.phonetic}</p>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSave}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent"
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

        <div className="mt-2 max-h-56 overflow-y-auto">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              查词中…
            </p>
          )}
          {!loading && entry === null && (
            <p className="text-sm text-muted-foreground">暂无释义</p>
          )}
          {!loading && entry && (
            <ul className="space-y-2">
              {entry.meanings.map((m, i) => (
                <li key={i} className="text-sm">
                  <span className="mr-1.5 italic text-muted-foreground">
                    {m.partOfSpeech}
                  </span>
                  {m.definition}
                  {m.example && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {m.example}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
