import { getToken } from '@/api/auth'

export interface AIConfig {
  provider: string
  base_url: string | null
  model: string | null
  has_api_key: boolean
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: { name: string; args: Record<string, unknown> }[]
}

export interface NoteOut {
  id: number
  article_id: number | null
  content: string
  created_at: string
}

export async function fetchAIConfig(): Promise<AIConfig> {
  const token = getToken()
  if (!token) throw new Error('未登录')
  const res = await fetch('/api/ai/config', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as AIConfig
}

export async function updateAIConfig(input: {
  base_url: string
  api_key: string
  model: string
}): Promise<AIConfig> {
  const token = getToken()
  if (!token) throw new Error('未登录')
  const res = await fetch('/api/ai/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { detail?: string } | null)?.detail ?? '保存失败')
  }
  return (await res.json()) as AIConfig
}

export type AIChatEvent =
  | { type: 'content'; text: string }
  | { type: 'tool'; name: string; args: Record<string, unknown>; result: string }
  | { type: 'done' }
  | { type: 'retry'; message: string }
  | { type: 'error'; message: string }

/** 流式对话：用 fetch 读 SSE，逐事件回调。 */
export async function streamChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  articleId: number | undefined,
  onEvent: (event: AIChatEvent) => void,
  signal?: AbortSignal,
  selectedText?: string,
): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('未登录')
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, article_id: articleId, selected_text: selectedText }),
    signal,
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error('浏览器不支持流式')
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        onEvent(JSON.parse(data) as AIChatEvent)
      } catch {
        // 忽略解析失败的行
      }
    }
  }
}
