import { useMemo, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Bot,
  Clock,
  ExternalLink,
  Minus,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { ArticleReader } from '@/components/ArticleReader'
import { ArticleThumb } from '@/components/ArticleThumb'
import { KeywordCarousel } from '@/components/KeywordCarousel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useUserData } from '@/context/UserDataContext'
import { useArticle } from '@/hooks/useArticle'
import { difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import { extractKeywords } from '@/lib/keywords'
import { startArticleSpeak, stopArticleSpeak } from '@/lib/speech'
import {
  deleteLocalArticle,
  getReadingFontSize,
  readingFontSizes,
  setReadingFontSize,
  type ReadingFontSize,
} from '@/lib/storage'

export function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { article, loading } = useArticle(Number(id))
  const { reading, markRead, saveProgress, bookmarks, toggleBookmark } =
    useUserData()
  const readingRef = useRef(reading)
  readingRef.current = reading
  const markReadRef = useRef(markRead)
  markReadRef.current = markRead
  const saveProgressRef = useRef(saveProgress)
  saveProgressRef.current = saveProgress
  const [restored, setRestored] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [fontSize, setFontSize] = useState<ReadingFontSize>(
    getReadingFontSize,
  )
  const [readingAloud, setReadingAloud] = useState(false)
  const [bookmarked, setBookmarked] = useState(() =>
    bookmarks.includes(Number(id)),
  )

  const handleToggleBookmark = async () => {
    const added = await toggleBookmark(Number(id))
    setBookmarked(added)
  }

  const keywords = useMemo(
    () => extractKeywords(article?.content ?? ''),
    [article],
  )

  const adjustFont = (delta: -1 | 1) => {
    const index = readingFontSizes.indexOf(fontSize)
    const next = readingFontSizes[Math.max(0, Math.min(readingFontSizes.length - 1, index + delta))]
    if (next !== fontSize) {
      setFontSize(next)
      setReadingFontSize(next)
    }
  }

  const toggleReadAloud = () => {
    if (!article) return
    if (readingAloud) {
      stopArticleSpeak()
      setReadingAloud(false)
    } else {
      const started = startArticleSpeak(
        article.content ?? '',
        () => setReadingAloud(false),
      )
      if (started) setReadingAloud(true)
    }
  }

  // 云端数据异步加载后恢复一次阅读进度（仅滚动，不挂监听）
  useEffect(() => {
    if (restored || !article) return
    const saved = reading[article.id]?.progress
    if (saved && saved > 0.01) {
      requestAnimationFrame(() => {
        const max =
          document.documentElement.scrollHeight - window.innerHeight
        window.scrollTo(0, max * saved)
      })
    }
    setRestored(true)
  }, [restored, article, reading])

  useEffect(() => {
    if (loading || !article) return
    const articleId = article.id
    let timer: number | undefined
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      setReadProgress(progress)
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(
        () =>
          void saveProgressRef.current(
            articleId,
            Math.min(1, Math.max(0, progress)),
          ),
        400,
      )
    }
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer) window.clearTimeout(timer)
      void markReadRef.current(articleId)
    }
  }, [loading, article?.id])

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">加载中…</p>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20">
        <h1 className="text-xl font-semibold">文章不存在</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回列表
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div
        className="fixed inset-x-0 top-14 z-30 h-0.5 bg-primary/10"
        aria-hidden="true"
      >
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(readProgress * 100)}%` }}
        />
      </div>
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回列表
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={bookmarked ? 'default' : 'outline'}
            onClick={() => void handleToggleBookmark()}
            title={bookmarked ? '取消收藏' : '收藏文章'}
            aria-pressed={bookmarked}
          >
            {bookmarked ? (
              <BookmarkCheck className="size-4" aria-hidden="true" />
            ) : (
              <Bookmark className="size-4" aria-hidden="true" />
            )}
            {bookmarked ? '已收藏' : '收藏'}
          </Button>
          <Button
            size="sm"
            variant={readingAloud ? 'default' : 'outline'}
            onClick={toggleReadAloud}
            title={readingAloud ? '停止朗读' : '朗读全文'}
            aria-pressed={readingAloud}
          >
            {readingAloud ? (
              <VolumeX className="size-4" aria-hidden="true" />
            ) : (
              <Volume2 className="size-4" aria-hidden="true" />
            )}
            {readingAloud ? '停止' : '朗读'}
          </Button>
          <div
            className="flex items-center rounded-lg border bg-background p-0.5"
            role="group"
            aria-label="字号调整"
          >
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => adjustFont(-1)}
              aria-label="减小字号"
              title="减小字号"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </Button>
            <span className="w-5 text-center text-xs text-muted-foreground">
              {readingFontSizes.indexOf(fontSize) + 1}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => adjustFont(1)}
              aria-label="增大字号"
              title="增大字号"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
          {article.sourceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden="true" />
                查看原文
              </a>
            </Button>
          )}
          {article.source === 'local' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                deleteLocalArticle(article.id)
                navigate('/')
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              删除文章
            </Button>
          )}
        </div>
      </div>

      <article>
        <header className="mb-6">
          <div className="mb-5 overflow-hidden rounded-xl border border-border">
            <ArticleThumb
              article={article}
              className="aspect-[21/9] w-full md:aspect-[3/1]"
            />
          </div>
          <h1 className="font-reading text-3xl font-bold leading-snug tracking-tight">
            {article.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className={difficultyStyles[article.difficulty]}>
              {difficultyLabels[article.difficulty]}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="size-4" aria-hidden="true" />
              {article.readTimeMinutes} 分钟阅读
            </span>
            <span>·</span>
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        {keywords.length > 0 && (
          <div className="mb-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <KeywordCarousel words={keywords} sourceTitle={article.title} />
          </div>
        )}

        <Separator className="mb-8 bg-foreground/10" />

        <ArticleReader
          content={article.content ?? ''}
          sourceTitle={article.title}
          fontSize={fontSize}
        />
      </article>

      <SelectionAskAI />
    </main>
  )
}

/** 阅读页：选中文本后弹出 Ask AI 按钮 */
function SelectionAskAI() {
  const [selection, setSelection] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()
      if (sel && sel.rangeCount > 0 && text && text.length > 0 && text.length < 2000) {
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        setSelection({ text, x: rect.right, y: rect.top - 8 })
      } else {
        setSelection(null)
      }
    }
    const onScroll = () => setSelection(null)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  if (!selection) return null

  const clampedX = Math.min(
    Math.max(selection.x - 60, 12),
    window.innerWidth - 140,
  )

  return (
    <div
      className="fixed z-50"
      style={{ top: selection.y, left: clampedX }}
    >
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('de:ai-ask-selection', {
              detail: {
                text: selection.text,
                question:
                  '请解释这段文本：翻译成中文、讲解其中的生词和语法要点。',
              },
            }),
          )
          setSelection(null)
        }}
        className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Bot className="size-3.5" aria-hidden="true" />
        Ask AI
      </button>
    </div>
  )
}
