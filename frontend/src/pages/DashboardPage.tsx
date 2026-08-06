import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  Award,
  Bookmark,
  BookOpen,
  CalendarDays,
  Eraser,
  Flame,
  Library,
  LineChart as LineChartIcon,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchArticles } from '@/api/articles'
import { fetchStats, type StatsData } from '@/api/me'
import {
  BarChart,
  Heatmap,
  LineChart,
} from '@/components/account/charts'
import { useAuth } from '@/context/AuthContext'
import { useUserData } from '@/context/UserDataContext'
import { isDue } from '@/lib/fsrs'
import { difficultyLabels, difficultyStyles } from '@/lib/difficulty'
import { clearDictCache, getDictCache } from '@/lib/storage'
import type { Article } from '@/types'

function weekStart(): number {
  const now = new Date()
  const day = now.getDay() || 7
  const start = new Date(now)
  start.setDate(now.getDate() - day + 1)
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

function ProgressBar({
  done,
  total,
  color = 'bg-primary',
}: {
  done: number
  total: number
  color?: string
}) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full ${color} rounded-full transition-[width] duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const { reading, vocabulary, bookmarks, migrated } = useUserData()
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    let active = true
    fetchArticles()
      .then((data) => {
        if (active) setArticles(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    fetchStats()
      .then((data) => {
        if (active) setStats(data)
      })
      .catch(() => {
        if (active) setStats(null)
      })
    return () => {
      active = false
    }
  }, [user])

  const localStats = useMemo(() => {
    const history = reading
    const vocab = vocabulary
    const bookmarksList = bookmarks
    const dictCache = getDictCache()
    const byId = new Map(articles.map((a) => [a.id, a]))

    const ids = Object.keys(history).map(Number)
    const totalRead = ids.length
    const weekStartTime = weekStart()
    const weekRead = ids.filter(
      (id) => new Date(history[id].readAt).getTime() >= weekStartTime,
    ).length
    // 有效阅读词数：按真实进度折算（读到50%记一半，读完才全记），不再按篇数估算
    const wordsRead = ids.reduce((sum, id) => {
      const article = byId.get(id)
      if (!article) return sum
      const progress = Math.max(0, Math.min(1, history[id]?.progress ?? 0))
      const words = (article.readTimeMinutes ?? 2) * 200 * progress
      return sum + words
    }, 0)

    const recent = ids
      .sort(
        (a, b) =>
          new Date(history[b].readAt).getTime() -
          new Date(history[a].readAt).getTime(),
      )
      .slice(0, 6)
      .map((id) => ({ id, article: byId.get(id) }))

    const dueCount = vocab.filter((w) => isDue(w.card)).length

    return {
      totalRead,
      weekRead,
      wordsRead,
      vocabCount: vocab.length,
      bookmarkCount: bookmarksList.length,
      dictCacheCount: Object.keys(dictCache).length,
      dueCount,
      recent,
    }
  }, [articles, reading, vocabulary, bookmarks])

  const [dictCount, setDictCount] = useState(localStats.dictCacheCount)

  const level = stats?.level
  const today = stats?.today

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {user ? `${user.username} 的学习` : '我的学习'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          你的阅读足迹与学习数据
        </p>
        {migrated && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            本机旧数据已同步到云端，现在换设备也能继续学习
          </p>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-3" aria-label="加载中">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : (
        <>
          {/* 等级 + streak + 今日目标 */}
          {level && today && (
            <section className="mb-5 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                    Lv{level.level}
                  </span>
                  <div>
                    <p className="text-base font-semibold">
                      {level.name} · {level.points} 分
                    </p>
                    <p className="text-xs text-muted-foreground">{level.hint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
                      <Flame className="size-5" aria-hidden="true" />
                      {stats?.streak ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">连续打卡</p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-2xl font-bold ${
                        today.checked_in
                          ? 'text-emerald-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {today.checked_in ? '已达成' : '未达成'}
                    </p>
                    <p className="text-xs text-muted-foreground">今日目标</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5" aria-hidden="true" />
                      阅读
                    </span>
                    <span>
                      {today.read_count} / {today.read_goal} 篇
                    </span>
                  </div>
                  <ProgressBar
                    done={today.read_count}
                    total={today.read_goal}
                    color={
                      today.read_count >= today.read_goal
                        ? 'bg-emerald-500'
                        : undefined
                    }
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="size-3.5" aria-hidden="true" />
                      复习
                    </span>
                    <span>
                      {today.review_count} / {today.review_goal} 词
                    </span>
                  </div>
                  <ProgressBar
                    done={today.review_count}
                    total={today.review_goal}
                    color={
                      today.review_count >= today.review_goal
                        ? 'bg-emerald-500'
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" asChild>
                  <Link to="/">去阅读</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/account/review">去复习</Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/account/settings">
                    <Target className="size-4" aria-hidden="true" />
                    调整目标
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* 累计统计卡 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={<LineChartIcon className="size-4" aria-hidden="true" />}
              label="累计阅读"
              value={`${localStats.totalRead} 篇`}
            />
            <StatCard
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
              label="本周阅读"
              value={`${localStats.weekRead} 篇`}
            />
            <StatCard
              icon={<BookOpen className="size-4" aria-hidden="true" />}
              label="累计阅读词数"
              value={Math.round(localStats.wordsRead).toLocaleString()}
            />
            <StatCard
              icon={<Library className="size-4" aria-hidden="true" />}
              label="生词本"
              value={`${localStats.vocabCount} 词`}
            />
            <StatCard
              icon={<Sparkles className="size-4" aria-hidden="true" />}
              label="待复习"
              value={`${localStats.dueCount} 词`}
            />
            <StatCard
              icon={<TrendingUp className="size-4" aria-hidden="true" />}
              label="累计复习"
              value={`${stats?.review_count ?? 0} 次`}
            />
          </div>

          {localStats.dueCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <span>有 {localStats.dueCount} 个生词待复习</span>
              <Link
                to="/account/review"
                className="ml-auto text-primary hover:underline"
              >
                去复习
              </Link>
            </div>
          )}

          {localStats.bookmarkCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <Bookmark className="size-4 text-primary" aria-hidden="true" />
              <span>你收藏了 {localStats.bookmarkCount} 篇文章</span>
              <Link to="/" className="ml-auto text-primary hover:underline">
                去阅读收藏
              </Link>
            </div>
          )}

          {/* 学习图表 */}
          {stats && (
            <section className="mt-8 flex flex-col gap-6">
              {stats.heatmap.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold">学习热力图</h2>
                  <div className="rounded-xl border bg-card p-4 text-card-foreground">
                    <Heatmap data={stats.heatmap} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      近 6 个月的学习足迹，颜色越深当天学得越多
                    </p>
                  </div>
                </div>
              )}

              {stats.vocabulary_curve.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <TrendingUp
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    词汇量增长
                  </h2>
                  <div className="rounded-xl border bg-card p-4 text-card-foreground">
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl font-bold tracking-tight">
                        {stats.vocab_count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        生词，其中已掌握 {stats.mastered_vocab} 词
                      </p>
                    </div>
                    <LineChart data={stats.vocabulary_curve} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      近 3 个月生词量累计曲线
                    </p>
                  </div>
                </div>
              )}

              {stats.review_trend.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <RotateCcw className="size-5 text-primary" aria-hidden="true" />
                    复习趋势
                  </h2>
                  <div className="rounded-xl border bg-card p-4 text-card-foreground">
                    <BarChart data={stats.review_trend} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      近 30 天每日复习次数
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 成就徽章 */}
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Award className="size-5 text-primary" aria-hidden="true" />
              成就徽章
            </h2>
            {stats && stats.achievements.length > 0 ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {stats.achievements.map((a) => (
                  <li
                    key={a.key}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                      a.unlocked
                        ? 'border-primary/20 bg-card'
                        : 'border-dashed opacity-50'
                    }`}
                    title={a.desc}
                  >
                    <span
                      className={`text-2xl ${a.unlocked ? '' : 'grayscale'}`}
                      aria-hidden="true"
                    >
                      {a.icon}
                    </span>
                    <span className="text-xs font-medium">{a.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {a.desc}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                完成学习任务解锁徽章
              </p>
            )}
          </section>

          <div className="mt-3 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
            <Library className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>词典缓存 {dictCount} 条</span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => {
                clearDictCache()
                setDictCount(0)
              }}
            >
              <Eraser className="size-4" aria-hidden="true" />
              清理缓存
            </Button>
          </div>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">最近阅读</h2>
            {localStats.recent.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                还没有阅读记录，去读一篇文章吧
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {localStats.recent.map(({ id, article }) => (
                  <li key={id}>
                    <Link
                      to={`/articles/${id}`}
                      className="block rounded-xl border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium">
                          {article?.title ?? `文章 #${id}`}
                        </span>
                        <span
                          className={`shrink-0 text-xs ${
                            article
                              ? difficultyStyles[article.difficulty]
                              : 'text-muted-foreground'
                          }`}
                        >
                          {article
                            ? difficultyLabels[article.difficulty]
                            : '本地'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(reading[id].readAt).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-8 flex gap-3">
            <Button asChild>
              <Link to="/">继续阅读</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account/review">复习生词</Link>
            </Button>
          </div>
        </>
      )}
    </main>
  )
}
