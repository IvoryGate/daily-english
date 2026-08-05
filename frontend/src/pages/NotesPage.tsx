import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getToken } from '@/api/auth'
import type { NoteOut } from '@/api/ai'

async function fetchNotes(): Promise<NoteOut[]> {
  const token = getToken()
  const res = await fetch('/api/ai/notes', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('加载失败')
  return (await res.json()) as NoteOut[]
}

export function NotesPage() {
  const [notes, setNotes] = useState<NoteOut[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = () => {
    fetchNotes()
      .then(setNotes)
      .catch(() => setNotes([]))
  }
  useEffect(load, [])

  const handleDelete = async (id: number) => {
    const token = getToken()
    const res = await fetch(`/api/ai/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setNotes((prev) => prev?.filter((n) => n.id !== id) ?? [])
      setMessage('笔记已删除')
    }
  }

  if (notes === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-muted-foreground">
        加载中…
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">我的笔记</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 助手帮你保存的学习笔记（共 {notes.length} 条）
        </p>
        {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
      </header>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-12 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            还没有笔记。用 AI 助手时说「把这句保存为笔记」即可。
          </p>
          <Button className="mt-4" asChild>
            <Link to="/">去阅读</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border bg-card p-4 text-card-foreground">
              <div className="flex items-start justify-between gap-3">
                <p className="flex-1 whitespace-pre-wrap text-sm leading-6">
                  {note.content}
                </p>
                <button
                  type="button"
                  onClick={() => void handleDelete(note.id)}
                  className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="删除笔记"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {new Date(note.created_at).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {note.article_id && (
                  <Link
                    to={`/articles/${note.article_id}`}
                    className="text-primary hover:underline"
                  >
                    查看关联文章
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
