import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { GraduationCap, LoaderCircle, TrendingUp } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { Badge } from '@/components/ui/badge'
import { fetchArticlesByVocab } from '@/api/articles'
import { fetchStats, type StatsData } from '@/api/me'
import { useAuth } from '@/context/AuthContext'
import {
  maxVocabForLevel,
  VOCAB_LABELS,
  VOCAB_LEVELS,
  vocabRangeForLevel,
  type VocabLevel,
} from '@/lib/learningPath'
import type { Article } from '@/types'

export function LearningPathPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [activeLevel, setActiveLevel] = useState<VocabLevel>(
    () => (searchParams.get('level') as VocabLevel) || 'junior',
  )
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setStats(null)
      return
    }
    let active = true
    fetchStats()
      .then((data) => {
        if (active) setStats(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    setError(null)
    let active = true
    fetchArticlesByVocab(activeLevel)
      .then((data) => {
        if (active) setArticles(data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [activeLevel])

  const selectLevel = (level: VocabLevel) => {
    setActiveLevel(level)
    setSearchParams({ level })
  }

  // 用户当前词汇容量：等级 → 建议区间 + 上限
  const userLevel = stats?.level.level ?? 0
  const range = userLevel > 0 ? vocabRangeForLevel(userLevel) : []
  const maxLevel = userLevel > 0 ? maxVocabForLevel(userLevel) : null

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* 页头 */}
      <section className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <GraduationCap className="size-6 text-primary" aria-hidden="true" />
          学习路径
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          从初中到超纲的词汇阶梯。按你的等级选择合适难度，一档一档往上读。
          每篇标注了词汇级别（读懂一半正文词所需的级别），跟着走不会太难也不会太容易。
        </p>
      </section>

      {/* 用户等级 → 建议区间 */}
      {userLevel > 0 && stats && (
        <section className="mb-8 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="size-4 text-primary" aria-hidden="true" />
            你的进度
            <Badge className="ml-1">Lv{stats.level.level} {stats.level.name}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            建议从 <span className="font-medium text-foreground">{range.map((l) => VOCAB_LABELS[l]).join(' / ')}</span>{' '}
            开始，最多读到{' '}
            <span className="font-medium text-foreground">{VOCAB_LABELS[maxLevel!]}</span>。
          </p>
        </section>
      )}

      {/* 词汇阶梯 */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-1 p-2 sm:grid-cols-4">
          {VOCAB_LEVELS.map((level, index) => {
            const isActive = level === activeLevel
            const isInRange = range.includes(level)
            const isBeyond = maxLevel != null && VOCAB_LEVELS.indexOf(level) > VOCAB_LEVELS.indexOf(maxLevel)
            return (
              <button
                key={level}
                type="button"
                onClick={() => selectLevel(level)}
                aria-pressed={isActive}
                className={`relative flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all ${
                  isActive
                    ? 'border-primary/40 bg-primary/10 shadow-sm'
                    : 'border-transparent hover:bg-accent/60'
                } ${isBeyond ? 'opacity-45' : ''}`}
              >
                <span className="text-xs font-semibold text-muted-foreground">
                  {index + 1} 档
                </span>
                <span className="font-reading text-lg font-bold">{VOCAB_LABELS[level]}</span>
                {isInRange && (
                  <span className="text-[11px] text-primary">← 建议范围</span>
                )}
                {isBeyond && (
                  <span className="text-[11px] text-muted-foreground">暂不推荐</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 该级别文章列表 */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-lg font-semibold">
            {VOCAB_LABELS[activeLevel]}难度文章
          </h2>
          {articles.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {articles.length} 篇 · 已按词汇量从易到难排序
            </span>
          )}
        </div>

        {loading && (
          <div aria-label="加载中" className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            加载中…
          </div>
        )}
        {error && <p className="py-10 text-sm text-destructive">{error}</p>}
        {!loading && !error && articles.length === 0 && (
          <p className="py-10 text-sm text-muted-foreground">
            这一档暂时还没有文章，先去其它级别看看吧。
          </p>
        )}
        {!loading && !error && articles.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}