import { config } from '@/config'
import type { Paged } from '@/types'
import { ApiError, messageForCode, type FieldErrors } from '../errors'
import { tokenStore, UNAUTHORIZED_EVENT } from '../token'

type QueryValue = string | number | boolean | undefined | null

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Object gửi JSON; FormData gửi multipart */
  body?: unknown
  query?: Record<string, QueryValue>
  /** Không tự làm mới token khi 401 (chính các lệnh đăng nhập / làm mới) */
  noRefresh?: boolean
  signal?: AbortSignal
}

/** Máy chủ bọc mọi phản hồi: { statusCode, message, data, pagination? } */
interface Envelope<T> {
  statusCode: number
  message: string
  data: T
  pagination?: { total: number; page: number; pageSize: number }
}

interface ErrorBody {
  statusCode?: number
  code?: string
  message?: string | string[]
  details?: unknown
}

const url = (path: string, query?: Record<string, QueryValue>) => {
  const u = new URL(config.apiBaseUrl.replace(/\/$/, '') + path, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') u.searchParams.set(key, String(value))
  }
  return u
}

/** Lỗi validate: details = [{ field, messages[] }] → { field: message đầu } */
function toFieldErrors(details: unknown): FieldErrors {
  if (!Array.isArray(details)) return {}
  const out: FieldErrors = {}
  for (const d of details) {
    if (d && typeof d.field === 'string' && Array.isArray(d.messages) && d.messages.length) out[d.field] ??= d.messages[0]
  }
  return out
}

/** Làm mới access token bằng cookie httpOnly. Nhiều request 401 cùng lúc chỉ gọi một lần. */
let refreshing: Promise<boolean> | null = null
export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= fetch(url('/auth/refresh'), { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' } })
    .then(async (res) => {
      if (!res.ok) return false
      const body = (await res.json()) as Envelope<{ accessToken: string }>
      tokenStore.set(body.data.accessToken)
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function send<T>(path: string, options: RequestOptions, retried = false): Promise<Envelope<T>> {
  const { method = 'GET', body, query, noRefresh, signal } = options
  const token = tokenStore.get()
  const isForm = body instanceof FormData
  let res: Response
  try {
    res = await fetch(url(path, query), {
      method,
      credentials: 'include',
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('Không kết nối được máy chủ', 0)
  }

  if (res.status === 401 && !noRefresh) {
    if (!retried && (await refreshAccessToken())) return send<T>(path, options, true)
    tokenStore.clear()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data ?? {}) as ErrorBody
    const code = err.code ?? ''
    const raw = Array.isArray(err.message) ? err.message[0] : err.message
    const message = raw || messageForCode(code) || `Lỗi máy chủ (${res.status})`
    throw new ApiError(message, res.status, toFieldErrors(err.details), code, err.details ?? null)
  }
  return (data ?? { statusCode: res.status, message: '', data: null }) as Envelope<T>
}

/** Gọi API, trả về phần `data` */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await send<T>(path, options)).data
}

/** Gọi API danh sách có phân trang */
export async function requestPaged<T>(path: string, options: RequestOptions = {}): Promise<Paged<T>> {
  const env = await send<T[]>(path, options)
  const items = env.data ?? []
  const p = env.pagination ?? { total: items.length, page: 1, pageSize: items.length }
  return { items, total: p.total, page: p.page, pageSize: p.pageSize }
}
