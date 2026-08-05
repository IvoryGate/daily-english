import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <div className="mb-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">登录</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          登录后生词本、收藏和阅读记录会同步到云端
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? '登录中…' : '登录'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？{' '}
        <Link to="/register" className="text-primary hover:underline">
          注册
        </Link>
      </p>
    </main>
  )
}
