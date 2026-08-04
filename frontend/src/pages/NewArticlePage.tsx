import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { addLocalArticle } from '@/lib/storage'
import type { Difficulty } from '@/types'

export function NewArticlePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [error, setError] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('标题和正文都不能为空')
      return
    }
    addLocalArticle({
      title: title.trim(),
      content: content.trim(),
      difficulty,
      tags: ['mine'],
    })
    navigate('/')
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">添加文章</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          粘贴任意英文文章（外刊、短文等），即可精读、点查生词 —— 内容只保存在本机
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="文章标题"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="content">正文</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={'粘贴英文文章正文…\n\n段落之间用空行分隔'}
            className="min-h-64 font-mono text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="difficulty">难度</Label>
          <Select
            value={difficulty}
            onValueChange={(value) => setDifficulty(value as Difficulty)}
          >
            <SelectTrigger id="difficulty" className="w-40">
              <SelectValue placeholder="选择难度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">入门</SelectItem>
              <SelectItem value="intermediate">进阶</SelectItem>
              <SelectItem value="advanced">挑战</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-fit">
          <Newspaper className="size-4" aria-hidden="true" />
          保存文章
        </Button>
      </form>
    </main>
  )
}
