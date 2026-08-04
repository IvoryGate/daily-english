import { useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, Check, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVocabulary, updateVocabulary } from '@/lib/storage'
import type { VocabEntry } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

function isDue(entry: VocabEntry): boolean {
  return new Date(entry.nextReviewAt).getTime() <= Date.now()
}

function review(entry: VocabEntry, remembered: boolean): VocabEntry {
  if (remembered) {
    const nextStage = Math.min(entry.stage + 1, 2)
    const interval = [1, 3, 7][entry.stage]
    return {
      ...entry,
      stage: nextStage,
      nextReviewAt: daysFromNow(interval),
    }
  }
  return {
    ...entry,
    stage: 0,
    nextReviewAt: daysFromNow(1),
  }
}

export function ReviewPage() {
  const [queue] = useState<VocabEntry[]>(() =>
    getVocabulary().filter(isDue),
  )
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const current = queue[index]

  const respond = (remembered: boolean) => {
    if (!current) return
    updateVocabulary(current.word, review(current, remembered))
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
    const rememberedCount = queue.length
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Check className="mx-auto size-10 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold">本轮复习完成</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          复习了 {rememberedCount} 个生词
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
        <span>{current.stage === 0 ? '新词' : current.stage === 1 ? '学习中' : '已掌握'}</span>
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
          <>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => respond(false)}
            >
              <X className="size-4" aria-hidden="true" />
              没记住
            </Button>
            <Button onClick={() => respond(true)}>
              <Check className="size-4" aria-hidden="true" />
              记住了
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setFlipped(true)}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            显示释义
          </Button>
        )}
      </div>
    </main>
  )
}
