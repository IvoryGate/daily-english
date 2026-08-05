import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Languages,
  LoaderCircle,
} from 'lucide-react'
import { useUserData } from '@/context/UserDataContext'
import { lookupWord } from '@/lib/dictionary'
import { translateBatch } from '@/lib/translate'
import { SpeakButtons } from '@/components/SpeakButtons'
import type { ReadingFontSize } from '@/lib/storage'
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
  fontSize?: ReadingFontSize
}

const FONT_SIZE_CLASS: Record<ReadingFontSize, string> = {
  sm: 'text-[15px] leading-[1.8]',
  md: 'text-[17px] leading-[1.9]',
  lg: 'text-[19px] leading-[1.95]',
  xl: 'text-[21px] leading-[2]',
}

export function ArticleReader({
  content,
  sourceTitle,
  fontSize = 'md',
}: ArticleReaderProps) {
  const [active, setActive] = useState<ActiveWord | null>(null)
  const [translations, setTranslations] = useState<Record<number, string>>({})
  const [translating, setTranslating] = useState(false)
  const [expandAll, setExpandAll] = useState(false)
  // 逐段手动收起集合（展开全文后仍可单独收起某段）
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set())
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

  // 翻译全文：翻译一次并持久保存（不因收起消失），然后全文展开
  const translateAll = async () => {
    if (translating) return
    // 已翻译过则只切换全文展开
    if (Object.keys(translations).length >= paragraphs.length) {
      setExpandAll((v) => !v)
      if (expandAll) {
        setCollapsedSet(new Set())
      }
      return
    }
    setTranslating(true)
    try {
      const result = await translateBatch(paragraphs)
      const map: Record<number, string> = {}
      result.forEach((t, i) => {
        if (t) map[i] = t
      })
      setTranslations(map)
      setExpandAll(true)
    } catch {
      // 失败静默
    } finally {
      setTranslating(false)
    }
  }

  // 逐段切换译文显示（不改变全文展开状态）
  const toggleParagraph = (index: number) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <div ref={containerRef}>
      {/* 整篇翻译工具条 */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void translateAll()}
          disabled={translating}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          {translating ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Languages className="size-3.5" aria-hidden="true" />
          )}
          {translating
            ? '翻译中…'
            : expandAll
              ? '收起全文翻译'
              : '翻译全文'}
        </button>
        {Object.keys(translations).length > 0 && (
          <span className="text-xs text-muted-foreground">
            已翻译 {Object.keys(translations).length} 段
            {expandAll ? '（可逐段收起）' : '（可逐段展开）'}
          </span>
        )}
      </div>

      <div
        className={`space-y-6 font-reading ${FONT_SIZE_CLASS[fontSize]} text-foreground/90`}
      >
        {paragraphs.map((paragraph, index) => (
          <Paragraph
            key={index}
            paragraph={paragraph}
            onWordClick={handleWordClick}
            translation={translations[index]}
            expandAll={expandAll}
            collapsed={collapsedSet.has(index)}
            onToggle={() => toggleParagraph(index)}
          />
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

interface ParagraphProps {
  paragraph: string
  onWordClick: (event: React.MouseEvent, word: string) => void
  translation?: string
  expandAll: boolean
  collapsed: boolean
  onToggle: () => void
}

function Paragraph({
  paragraph,
  onWordClick,
  translation,
  expandAll,
  collapsed,
  onToggle,
}: ParagraphProps) {
  // 显示译文的条件：有译文 且 展开全文时未被单独收起 / 或单独展开时
  const show = !!translation && (expandAll ? !collapsed : collapsed)

  return (
    <div className="group relative">
      <p className="first-letter:mt-2">
        {tokenize(paragraph).map((token, i) =>
          token.isWord ? (
            <button
              key={i}
              type="button"
              className="cursor-pointer rounded-sm px-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={(event) => onWordClick(event, token.text)}
            >
              {token.text}
            </button>
          ) : (
            <span key={i}>{token.text}</span>
          ),
        )}
      </p>

      {/* 逐段翻译展示（可单独展开/收起，不依赖全文状态） */}
      {translation && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground/70 transition-colors hover:text-primary"
            aria-label={show ? '收起本段译文' : '展开本段译文'}
            aria-pressed={show}
          >
            <ChevronDown
              className={`size-3 transition-transform ${show ? '' : '-rotate-90'}`}
              aria-hidden="true"
            />
            译文
          </button>
          {show && (
            <p className="mt-1 rounded-lg bg-muted/50 px-3 py-2 text-sm leading-6 text-muted-foreground">
              {translation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function WordPanel({ word, x, y, sourceTitle, onClose }: WordPanelProps) {
  const { vocabulary, addVocabulary, removeVocabulary } = useUserData()
  const [entry, setEntry] = useState<DictEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(() =>
    vocabulary.some((w) => w.word === word.toLowerCase()),
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

  const toggleSave = async () => {
    if (saved) {
      await removeVocabulary(word.toLowerCase())
      setSaved(false)
    } else {
      await addVocabulary({
        word: word.toLowerCase(),
        phonetic: entry?.phoneticUs ?? entry?.phoneticUk,
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
          <div className="flex items-center gap-1.5">
            <div>
              <h3 className="text-base font-semibold">{word}</h3>
              {(entry?.phoneticUs || entry?.phoneticUk) && (
                <p className="text-xs text-muted-foreground">
                  <span className="mr-1.5">美 {entry?.phoneticUs}</span>
                  {entry?.phoneticUk && <span>英 {entry?.phoneticUk}</span>}
                </p>
              )}
            </div>
            {!loading && (
              <SpeakButtons
                word={word}
                audioUs={entry?.audioUs}
                audioUk={entry?.audioUk}
                size="xs"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => void toggleSave()}
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
