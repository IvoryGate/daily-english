import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FileText, Pencil, Plus, Trash2, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { NoteEditor } from '@/components/NoteEditor'
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  type NoteOut,
} from '@/api/ai'
import { useAuth } from '@/context/AuthContext'

export function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<NoteOut[] | null>(null)
  const [editing, setEditing] = useState<{ id: number | null; content: string } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetchNotes()
      .then(setNotes)
      .catch(() => setNotes([]))
  }
  useEffect(load, [])

  const flash = (msg: string) => {
    setMessage(msg)
    window.setTimeout(() => setMessage(null), 2000)
  }

  const startNew = () => {
    setEditing({ id: null, content: '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!editing || !editing.content.trim()) return
    setSaving(true)
    try {
      if (editing.id === null) {
        const note = await createNote(editing.content.trim())
        setNotes((prev) => [note, ...(prev ?? [])])
        flash('笔记已保存')
      } else {
        const updated = await updateNote(editing.id, editing.content.trim())
        setNotes((prev) => prev?.map((n) => (n.id === updated.id ? updated : n)) ?? [])
        flash('笔记已更新')
      }
      setEditing(null)
    } catch {
      flash('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除这条笔记？')) return
    try {
      await deleteNote(id)
      setNotes((prev) => prev?.filter((n) => n.id !== id) ?? [])
      if (editing?.id === id) setEditing(null)
      flash('笔记已删除')
    } catch {
      flash('删除失败')
    }
  }

  if (notes === null) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-muted-foreground">
        加载中…
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的笔记</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user
              ? '所见即所得，随时可编辑的学习笔记'
              : '请先登录后管理笔记'}
          </p>
          {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
        </div>
        {user && (
          <Button onClick={startNew} disabled={editing !== null && editing.id === null}>
            <Plus className="size-4" aria-hidden="true" />
            写新笔记
          </Button>
        )}
      </header>

      {editing && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {editing.id === null ? '新笔记' : '编辑笔记'}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="关闭编辑器"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
            <NoteEditor
              value={editing.content}
              onChange={(content) => setEditing({ ...editing, content })}
              placeholder={'用 Markdown 写笔记…\n\n## 今日要点\n- 记下新学的单词和句型'}
            />
            <div className="flex items-center justify-end gap-2 border-t px-3 py-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving || !editing.content.trim()}
              >
                {saving ? '保存中…' : '保存'}
              </Button>
            </div>
          </div>
        </section>
      )}

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-12 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            {user
              ? '还没有笔记。点右上角「写新笔记」，或用 AI 助手说「把这句保存为笔记」。'
              : '还没有笔记。用 AI 助手说「把这句保存为笔记」即可。'}
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
                <div className="min-w-0 flex-1 space-y-2 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {user && (
                    <button
                      type="button"
                      onClick={() => setEditing({ id: note.id, content: note.content })}
                      className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="编辑笔记"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  {user && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(note.id)}
                      className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="删除笔记"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
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