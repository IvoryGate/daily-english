import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, Check, RotateCcw } from 'lucide-react'
import { Rating } from 'ts-fsrs'
import { Button } from '@/components/ui/button'
import { useUserData } from '@/context/UserDataContext'
import { isDue, review } from '@/lib/fsrs'
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

export function ReviewPage() {
  const { vocabulary, updateVocabulary, loading } = useUserData()
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
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  if (queue.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <BookOpen className="mx-auto size-10 text-muted-foreground" />
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
        <Check className="mx-auto size-10 text-emerald-600" />
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
        <span>{stateLabel(current.card.state)}</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-56 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center transition-transform hover:-translate-y-0.5"
      >
        {flipped ? (
          <>
            <span className="text-xs text-muted-foreground">
              {current.phonetic ?? ''}
            </span>
            <p className="mt-3 text-lg leading-7">{current.definition}</p>
            <span className="mt-6 text-xs text-muted-foreground">
              来自：{current.sourceTitle}
            </span>
          </>
        ) : (
          <span className="text-4xl font-bold tracking-tight">
            {current.word}
          </span>
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
