import type { User } from '@/types'

const TOKEN_KEY = 'de.authToken.v1'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface UserDTO {
  id: number
  username: string
  email: string
  created_at: string
}

function toUser(dto: UserDTO): User {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    createdAt: dto.created_at,
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = (body as { detail?: string } | null)?.detail
    throw new Error(detail ?? `请求失败（${res.status}）`)
  }
  return (await res.json()) as T
}

export async function register(input: {
  username: string
  email: string
  password: string
}): Promise<User> {
  return toUser(await request<UserDTO>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
}

export async function login(input: {
  email: string
  password: string
}): Promise<void> {
  const data = await request<{ access_token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setToken(data.access_token)
}

export async function fetchMe(): Promise<User> {
  const token = getToken()
  if (!token) throw new Error('未登录')
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return toUser((await res.json()) as UserDTO)
}
