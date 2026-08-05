import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, Check, RotateCcw, Shuffle, Volume2 } from 'lucide-react'
import { Rating } from 'ts-fsrs'
import { Button } from '@/components/ui/button'
import { useUserData } from '@/context/UserDataContext'
import { isDue, review } from '@/lib/fsrs'
import { speak } from '@/lib/speech'
import type { VocabEntry } from '@/types'

const RATINGS = [
  { rating: Rating.Again, label: '忘记' },
  { rating: Rating.Hard, label: '困难' },
  { rating: Rating.Good, label: '良好' },
  { rating: Rating.Easy, label: '简单' },
]

function stateLabel(state: number): string {
  switch (state) {
    case 0:
      return '新词'
    case 1:
      return '学习中'
    case 3:
      return '重学中'
    default:
      return '复习中'
  }
}

function shuffle<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function ReviewPage() {
  const { vocabulary, updateVocabulary, loading, online } = useUserData()
  const [queue, setQueue] = useState<VocabEntry[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const snapshotRef = useRef(false)

  // 数据（云端异步加载）就绪后再取一次待复习队列快照
  useEffect(() => {
    if (loading || snapshotRef.current) return
    snapshotRef.current = true
    setQueue(vocabulary.filter((w) => isDue(w.card)))
  }, [loading, vocabulary])

  const current = queue[index]

  const respond = async (rating: Rating) => {
    if (!current) return
    await updateVocabulary(current.word, {
      card: review(current.card, rating),
    })
    // 记录复习历史（驱动 streak/统计/成就）
    if (online) {
      try {
        await fetch('/api/me/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('de.authToken.v1')}`,
          },
          body: JSON.stringify({ word: current.word, rating }),
        })
      } catch {
        // 记录失败不阻塞复习
      }
    }
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  const handleShuffle = () => {
    if (index === 0) {
      setQueue((q) => shuffle(q))
    } else {
      setQueue((q) => [...q.slice(0, index), ...shuffle(q.slice(index))])
    }
  }

  if (queue.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">今天没有待复习的生词</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          去阅读收藏一些生词，或稍后再来
        </p>
        <Button className="mt-6" asChild>
          <Link to="/">去阅读</Link>
        </Button>
      </main>
    )
  }

  if (index >= queue.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">本轮复习完成</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          复习了 {queue.length} 个生词
        </p>
        <Button className="mt-6" asChild>
          <Link to="/vocabulary">查看生词本</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          复习进度 {index + 1} / {queue.length}
        </span>
        <div className="flex items-center gap-2">
          <span>{stateLabel(current.card.state)}</span>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleShuffle}
            title="乱序复习"
            aria-label="乱序复习"
          >
            <Shuffle className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-56 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-sm transition-transform hover:-translate-y-0.5"
      >
        {flipped ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold">{current.word}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  speak(current.word)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    speak(current.word)
                  }
                }}
                className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label={`朗读 ${current.word}`}
                title="朗读发音"
              >
                <Volume2 className="size-4" aria-hidden="true" />
              </span>
            </div>
            <span className="mt-2 text-xs text-muted-foreground">
              {current.phonetic ?? ''}
            </span>
            <p className="mt-3 text-lg leading-7">{current.definition}</p>
            <span className="mt-6 text-xs text-muted-foreground">
              来自：{current.sourceTitle}
            </span>
          </>
        ) : (
          <>
            <span className="text-4xl font-bold tracking-tight">
              {current.word}
            </span>
            <span className="mt-3 text-xs text-muted-foreground">
              点击卡片查看释义
            </span>
          </>
        )}
      </button>

      <div className="mt-6 flex justify-center gap-4">
        {flipped ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RATINGS.map(({ rating, label }) => (
              <Button
                key={rating}
                variant={
                  rating === Rating.Again ? 'outline' : rating === Rating.Easy ? 'default' : 'secondary'
                }
                className={
                  rating === Rating.Again
                    ? 'text-destructive'
                    : rating === Rating.Easy
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : ''
                }
                onClick={() => void respond(rating)}
              >
                {label}
              </Button>
            ))}
            <p className="col-span-full text-center text-xs text-muted-foreground">
              忘记 / 困难 / 良好 / 简单 —— 你的回忆难度会调整下次复习时间
            </p>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setFlipped(true)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            显示释义
          </Button>
        )}
      </div>
    </main>
  )
}
