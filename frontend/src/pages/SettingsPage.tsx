import { useEffect, useState, type FormEvent } from 'react'
import { AtSign, BookOpen, Bot, Database, Download, Eraser, KeyRound, Target, UserRound } from 'lucide-react'
import { changePassword, updateUsername } from '@/api/auth'
import { fetchAIConfig, updateAIConfig, type AIConfig } from '@/api/ai'
import { fetchGoals, updateGoals } from '@/api/me'
import { useAuth } from '@/context/AuthContext'
import { useUserData } from '@/context/UserDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { vocabulary, bookmarks, reading, online, clearAll } = useUserData()

  const [username, setUsername] = useState(user?.username ?? '')
  const [userMsg, setUserMsg] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)
  const [pwdError, setPwdError] = useState<string | null>(null)

  const [confirmClear, setConfirmClear] = useState(false)
  const [clearMsg, setClearMsg] = useState<string | null>(null)

  const [readGoal, setReadGoal] = useState(1)
  const [reviewGoal, setReviewGoal] = useState(1)
  const [goalMsg, setGoalMsg] = useState<string | null>(null)
  const [goalError, setGoalError] = useState<string | null>(null)

  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const [aiBaseUrl, setAiBaseUrl] = useState('https://api.openai.com/v1')
  const [aiApiKey, setAiApiKey] = useState('')
  const [aiModel, setAiModel] = useState('gpt-4o-mini')
  const [aiMsg, setAiMsg] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchGoals()
      .then((g) => {
        setReadGoal(g.read_goal)
        setReviewGoal(g.review_goal)
      })
      .catch(() => {})
    fetchAIConfig()
      .then((c) => {
        setAiConfig(c)
        if (c.has_api_key) {
          setAiBaseUrl(c.base_url ?? 'https://api.openai.com/v1')
          setAiModel(c.model ?? 'gpt-4o-mini')
        }
      })
      .catch(() => {})
  }, [user])

  if (!user) return null

  const handleUsername = async (e: FormEvent) => {
    e.preventDefault()
    setUserMsg(null)
    setUserError(null)
    try {
      await updateUsername(username.trim())
      await refreshUser()
      setUserMsg('用户名已更新')
    } catch (err) {
      setUserError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    setPwdError(null)
    if (newPassword.length < 6) {
      setPwdError('新密码至少 6 位')
      return
    }
    try {
      await changePassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      setPwdMsg('密码已更新')
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : '修改失败')
    }
  }

  const handleGoals = async (e: FormEvent) => {
    e.preventDefault()
    setGoalMsg(null)
    setGoalError(null)
    if (readGoal < 1 || readGoal > 50 || reviewGoal < 0 || reviewGoal > 200) {
      setGoalError('阅读目标 1~50 篇，复习目标 0~200 词')
      return
    }
    try {
      await updateGoals({ read_goal: readGoal, review_goal: reviewGoal })
      setGoalMsg('每日目标已保存')
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : '保存失败')
    }
  }

  const handleAIConfig = async (e: FormEvent) => {
    e.preventDefault()
    setAiMsg(null)
    setAiError(null)
    try {
      const updated = await updateAIConfig({
        base_url: aiBaseUrl.trim(),
        api_key: aiApiKey.trim(),
        model: aiModel.trim(),
      })
      setAiConfig(updated)
      setAiApiKey('')
      setAiMsg(
        updated.has_api_key
          ? `已启用你自己的模型：${updated.model ?? '未设置'}`
          : '已恢复为默认的 Zen 免费模型',
      )
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '保存失败')
    }
  }

  const handleUseZen = async () => {
    setAiMsg(null)
    setAiError(null)
    try {
      const updated = await updateAIConfig({ base_url: '', api_key: '', model: '' })
      setAiConfig(updated)
      setAiMsg('已恢复为默认的 Zen 免费模型')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleExport = () => {
    const payload = {
      app: 'DailyEnglish',
      type: 'user-data-export',
      exportedAt: new Date().toISOString(),
      vocabulary,
      bookmarks,
      reading,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `dailyenglish-data-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = async () => {
    setClearMsg(null)
    await clearAll()
    setConfirmClear(false)
    setClearMsg('已清空云端数据')
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">个人设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          账号信息与学习数据管理
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
            账号信息
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <AtSign className="size-3.5" aria-hidden="true" />
            {user.email}
          </p>

          <form onSubmit={handleUsername} className="mt-4 flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                required
                minLength={2}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <Button type="submit">保存用户名</Button>
          </form>
          {userMsg && <p className="mt-2 text-xs text-emerald-600">{userMsg}</p>}
          {userError && <p className="mt-2 text-xs text-destructive">{userError}</p>}
        </section>

        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="size-4 text-muted-foreground" aria-hidden="true" />
            修改密码
          </h2>
          <form onSubmit={handlePassword} className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="oldPassword">原密码</Label>
              <Input
                id="oldPassword"
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 位"
              />
            </div>
            {pwdMsg && <p className="text-xs text-emerald-600">{pwdMsg}</p>}
            {pwdError && <p className="text-xs text-destructive">{pwdError}</p>}
            <div>
              <Button type="submit">更新密码</Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Target className="size-4 text-muted-foreground" aria-hidden="true" />
            每日目标
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            阅读和复习都达标才算当天打卡（决定连续打卡天数）
          </p>
          <form onSubmit={handleGoals} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="readGoal">
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  每日阅读（篇）
                </span>
              </Label>
              <Input
                id="readGoal"
                type="number"
                min={1}
                max={50}
                value={readGoal}
                onChange={(e) => setReadGoal(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reviewGoal">
                <span className="flex items-center gap-1">
                  <Target className="size-3.5" aria-hidden="true" />
                  每日复习（词）
                </span>
              </Label>
              <Input
                id="reviewGoal"
                type="number"
                min={0}
                max={200}
                value={reviewGoal}
                onChange={(e) => setReviewGoal(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Button type="submit">保存目标</Button>
          </form>
          {goalMsg && <p className="mt-2 text-xs text-emerald-600">{goalMsg}</p>}
          {goalError && <p className="mt-2 text-xs text-destructive">{goalError}</p>}
        </section>

        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Bot className="size-4 text-muted-foreground" aria-hidden="true" />
            AI 模型
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            默认使用 OpenCode Zen 免费模型（无需 key）；也可以填入你自己的 OpenAI 兼容 API key。
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">
              {aiConfig?.has_api_key ? '使用中：自定义模型' : '使用中：Zen 免费模型'}
            </span>
            {aiConfig?.has_api_key && (
              <span className="text-xs text-muted-foreground">
                {aiConfig.base_url} · {aiConfig.model}
              </span>
            )}
          </div>

          <form onSubmit={handleAIConfig} className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aiBaseUrl">Base URL</Label>
              <Input
                id="aiBaseUrl"
                value={aiBaseUrl}
                onChange={(e) => setAiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aiApiKey">API Key</Label>
              <Input
                id="aiApiKey"
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={aiConfig?.has_api_key ? '已配置（留空则保持不变）' : 'sk-...'}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aiModel">模型</Label>
              <Input
                id="aiModel"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="gpt-4o-mini / deepseek-chat"
              />
            </div>
            {aiMsg && <p className="text-xs text-emerald-600">{aiMsg}</p>}
            {aiError && <p className="text-xs text-destructive">{aiError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="submit">保存模型配置</Button>
              {aiConfig?.has_api_key && (
                <Button type="button" variant="outline" onClick={() => void handleUseZen()}>
                  恢复 Zen 免费
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Database className="size-4 text-muted-foreground" aria-hidden="true" />
            数据管理
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            当前云端数据：{vocabulary.length} 个生词 · {bookmarks.length} 篇收藏 ·{' '}
            {Object.keys(reading).length} 条阅读记录
            {!online && '（未登录，数据保存在本机）'}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" aria-hidden="true" />
              导出数据
            </Button>
            {!confirmClear ? (
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmClear(true)}
              >
                <Eraser className="size-4" aria-hidden="true" />
                清空数据
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">确定清空全部学习数据？</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void handleClear()}
                >
                  确认清空
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                  取消
                </Button>
              </div>
            )}
          </div>
          {clearMsg && <p className="mt-2 text-xs text-emerald-600">{clearMsg}</p>}
        </section>
      </div>
    </main>
  )
}
