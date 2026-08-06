import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  Bold,
  Check,
  Code2,
  FileText,
  Heading,
  Italic,
  Link2,
  List,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  type NoteOut,
} from '@/api/ai'
import { useAuth } from '@/context/AuthContext'

/** 给 textarea 在光标处插入文本 */
function insertAtCursor(
  el: HTMLTextAreaElement,
  insert: string,
  wrap = true,
): { start: number; end: number; sel: string } {
  const { selectionStart: s, selectionEnd: e, value } = el
  const sel = value.slice(s, e)
  const before = wrap ? `${insert}${sel}` : sel + insert
  const after = wrap ? `${insert}` : ''
  el.value = `${value.slice(0, s)}${before}${after}${value.slice(e)}`
  const start = s + (wrap ? insert.length : sel.length + insert.length)
  return { start, end: start + sel.length, sel }
}

function formatSelection(
  el: HTMLTextAreaElement,
  type: 'bold' | 'italic' | 'heading' | 'code' | 'link' | 'list',
): { start: number; end: number } {
  const map = {
    bold: '**',
    italic: '*',
    heading: '## ',
    code: '`',
    link: '[',
    list: '- ',
  } as const
  const mark = map[type]
  if (type === 'heading') {
    const { selectionStart, selectionEnd, value } = el
    const before = value.slice(0, selectionStart)
    const lineStart = before.lastIndexOf('\n') + 1
    el.value =
      value.slice(0, lineStart) + mark + value.slice(lineStart)
    return { start: selectionStart + mark.length, end: selectionEnd + mark.length }
  }
  if (type === 'link') {
    const { selectionStart, selectionEnd, value } = el
    const sel = value.slice(selectionStart, selectionEnd)
    const wrapTxt = `[${sel}](url)`
    el.value =
      value.slice(0, selectionStart) +
      wrapTxt +
      value.slice(selectionEnd)
    return { start: selectionStart, end: selectionStart + wrapTxt.length }
  }
  if (type === 'list') {
    const { selectionStart, selectionEnd, value } = el
    el.value = value.slice(0, selectionStart) + mark + value.slice(selectionStart)
    return { start: selectionStart + mark.length, end: selectionEnd + mark.length }
  }
  return insertAtCursor(el, mark, true)
}

export function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<NoteOut[] | null>(null)
  const [editing, setEditing] = useState<{ id: number | null; content: string } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const load = () => {
    fetchNotes()
      .then(setNotes)
      .catch(() => setNotes([]))
  }
  useEffect(load, [])

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

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

  const toolbar = [
    { key: 'bold', icon: Bold, label: '加粗', type: 'bold' as const },
    { key: 'italic', icon: Italic, label: '斜体', type: 'italic' as const },
    { key: 'heading', icon: Heading, label: '标题', type: 'heading' as const },
    { key: 'code', icon: Code2, label: '行内代码', type: 'code' as const },
    { key: 'link', icon: Link2, label: '链接', type: 'link' as const },
    { key: 'list', icon: List, label: '列表', type: 'list' as const },
  ]

  const runTool = (type: (typeof toolbar)[number]['type']) => {
    const el = textareaRef.current
    if (!el) return
    formatSelection(el, type)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.focus()
    const s = el.selectionStart
    const e = el.selectionEnd
    window.requestAnimationFrame(() => el.setSelectionRange(s, e))
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
            {user ? '支持 Markdown 语法的个人学习笔记' : '请先登录后管理笔记'}
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
            <div className="flex items-center gap-0.5 border-b px-2 py-1.5">
              {toolbar.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  title={t.label}
                  onClick={() => runTool(t.type)}
                  className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <t.icon className="size-4" aria-hidden="true" />
                </button>
              ))}
              <span className="ml-auto pr-1 text-[11px] text-muted-foreground">
                支持 Markdown
              </span>
            </div>
            <div className="grid min-h-64 md:grid-cols-2">
              <Textarea
                ref={textareaRef}
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                placeholder={'用 Markdown 写笔记…\n\n## 今日要点\n- 记下新学的单词和句型'}
                className="min-h-64 resize-y rounded-none border-0 p-4 font-mono text-sm focus-visible:ring-0"
              />
              <div className="hidden max-h-96 overflow-y-auto border-l p-4 text-sm leading-6 md:block">
                {editing.content.trim() ? (
                  <div className="space-y-2 text-foreground [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {editing.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground">预览将在这里显示…</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-3 py-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving || !editing.content.trim()}
              >
                {saving ? '保存中…' : (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    保存
                  </>
                )}
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
