import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, LoaderCircle, Search, Send, Sparkles, X } from 'lucide-react'
import {
  streamChat,
  type AIChatEvent,
  type AIMessage,
} from '@/api/ai'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SUGGESTIONS = [
  '解释一下我读的文章里某个难句',
  '帮我造几个包含某个生词的例句',
  '总结文章并指出重点词汇',
]

const TOOL_LABELS: Record<string, string> = {
  web_search: '搜索',
  get_article: '读取文章',
  lookup_word: '查词',
  get_learning_stats: '读取学习数据',
  save_note: '保存笔记',
}

/** 思考中指示器：字符旋转 + 省略号增长动画 */
function Thinking() {
  return (
    <span className="flex items-center text-muted-foreground">
      <span className="thinking-char" aria-hidden="true" />
      <span className="text-xs">思考中</span>
      <span className="thinking-dots" aria-hidden="true" />
    </span>
  )
}

export function AIChat() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string | undefined>()
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 从 URL /articles/:id 识别当前文章，供 AI 参考
  const articleId = useMemo(() => {
    const m = location.pathname.match(/^\/articles\/(\d+)/)
    return m ? Number(m[1]) : undefined
  }, [location.pathname])

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  // 接收外部触发的"AI 提问"（生词本/复习页按钮 → CustomEvent）
  useEffect(() => {
    const askHandler = (e: Event) => {
      const question = (e as CustomEvent<string>).detail
      setOpen(true)
      setMessages([]) // 新会话
      setInput(question)
    }
    const selectionHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string; question: string }>).detail
      setPendingSelection(detail.text)
      setOpen(true)
      setMessages([])
      setInput(detail.question)
    }
    window.addEventListener('de:ai-ask', askHandler)
    window.addEventListener('de:ai-ask-selection', selectionHandler)
    return () => {
      window.removeEventListener('de:ai-ask', askHandler)
      window.removeEventListener('de:ai-ask-selection', selectionHandler)
    }
  }, [])

  const send = useCallback(
    async (text: string, selection?: string) => {
      if (!text.trim() || busy) return
      const userMsg: AIMessage = { role: 'user', content: text.trim() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setPendingSelection(undefined)
      setBusy(true)

      const history = messages
        .filter((m) => m.role === 'user' || m.content)
        .map((m) => ({ role: m.role, content: m.content }))
      const assistantMsg: AIMessage = { role: 'assistant', content: '', toolCalls: [] }
      setMessages((prev) => [...prev, assistantMsg])

      const abort = new AbortController()
      abortRef.current = abort

      const updateAssistant = (fn: (m: AIMessage) => AIMessage) => {
        setMessages((prev) => {
          const next = [...prev]
          const idx = next.length - 1
          next[idx] = fn(next[idx])
          return next
        })
      }

      try {
        await streamChat(
          [...history, { role: 'user', content: userMsg.content }],
          articleId,
          (event: AIChatEvent) => {
            if (event.type === 'content') {
              updateAssistant((m) => ({ ...m, content: m.content + event.text }))
            } else if (event.type === 'tool') {
              updateAssistant((m) => ({
                ...m,
                toolCalls: [
                  ...(m.toolCalls ?? []),
                  { name: event.name, args: event.args },
                ],
              }))
            } else if (event.type === 'retry') {
              updateAssistant((m) => ({
                ...m,
                content: m.content + `\n🔄 ${event.message}`,
              }))
            } else if (event.type === 'error') {
              updateAssistant((m) => ({ ...m, content: m.content + `\n⚠️ ${event.message}` }))
            }
          },
          abort.signal,
          selection ?? pendingSelection,
        )
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          updateAssistant((m) => ({ ...m, content: m.content + '\n⚠️ 请求失败' }))
        }
      } finally {
        setBusy(false)
        abortRef.current = null
      }
    },
    [busy, messages, articleId, pendingSelection],
  )

  const stop = () => {
    abortRef.current?.abort()
    setBusy(false)
  }

  if (!user) return null

  return (
    <>
      {/* 悬浮按钮 */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-3 pr-4 text-sm font-medium text-foreground shadow-lg transition-all hover:border-primary/40 hover:shadow-xl"
          aria-label="打开 AI 学习助手"
          title="AI 学习助手"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          AI 助手
        </button>
      )}

      {/* 侧边抽屉 */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col border-l bg-card shadow-2xl sm:w-[440px] md:w-[520px] lg:w-[540px]">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">AI 学习助手</p>
                  <p className="text-[10px] text-muted-foreground">
                    {articleId ? '已关联当前文章' : '可查词/搜索/记笔记'}
                  </p>
                </div>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => setOpen(false)} aria-label="关闭">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <div className="py-8 text-center">
                  <Bot className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    问我任何关于英语学习的问题
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        onClick={() => void send(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {m.toolCalls.map((t, ti) => (
                        <span
                          key={ti}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                        >
                          {t.name === 'web_search' ? (
                            <Search className="size-3" aria-hidden="true" />
                          ) : (
                            <Sparkles className="size-3" aria-hidden="true" />
                          )}
                          {TOOL_LABELS[t.name] ?? t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.role === 'assistant' ? (
                    <div className="ai-markdown">
                      {m.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      ) : busy && i === messages.length - 1 ? (
                        <Thinking />
                      ) : null}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send(input)
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="问点什么…"
                className="flex-1"
                disabled={busy}
              />
              {busy ? (
                <Button size="icon" type="button" onClick={stop} aria-label="停止">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                </Button>
              ) : (
                <Button size="icon" type="submit" aria-label="发送">
                  <Send className="size-4" aria-hidden="true" />
                </Button>
              )}
            </form>
          </div>
          </div>
        </div>
      )}
    </>
  )
}
