import { useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isDue } from '@/lib/fsrs'
import { getVocabulary, removeVocabulary } from '@/lib/storage'
import type { VocabEntry } from '@/types'

const stateLabels: Record<number, string> = {
  0: '新词',
  1: '学习中',
  2: '复习中',
  3: '重学中',
}

export function VocabularyPage() {
  const [entries, setEntries] = useState<VocabEntry[]>(getVocabulary)

  const handleRemove = (word: string) => {
    removeVocabulary(word)
    setEntries(getVocabulary())
  }

  if (entries.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <BookOpen className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">生词本还是空的</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          阅读文章时点击单词，点「收藏生词」就会出现在这里
        </p>
        <Button className="mt-6" asChild>
          <Link to="/">去读一篇文章</Link>
        </Button>
      </main>
    )
  }

  const dueCount = entries.filter((e) => isDue(e.card)).length

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">生词本</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {entries.length} 个生词
          </p>
        </div>
        {dueCount > 0 && (
          <Button size="sm" asChild>
            <Link to="/review">{dueCount} 个待复习</Link>
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.word}
            className="rounded-xl border bg-card p-4 text-card-foreground"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{entry.word}</span>
                  {entry.phonetic && (
                    <span className="text-xs text-muted-foreground">
                      {entry.phonetic}
                    </span>
                  )}
                  <Badge variant="outline">
                    {stateLabels[entry.card.state] ?? '复习中'}
                  </Badge>
                  {isDue(entry.card) && <Badge>待复习</Badge>}
                </div>
                {entry.definition && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.definition}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground/70">
                  来自：{entry.sourceTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(entry.word)}
                className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`删除 ${entry.word}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
