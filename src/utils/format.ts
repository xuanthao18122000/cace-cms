import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

const parse = (value: string | null | undefined) => {
  if (!value) return null
  const d = parseISO(value)
  return isValid(d) ? d : null
}

export function formatDate(value: string | null | undefined, fallback = '—') {
  const d = parse(value)
  return d ? format(d, 'dd/MM/yyyy', { locale: vi }) : fallback
}

export function formatDateTime(value: string | null | undefined, fallback = '—') {
  const d = parse(value)
  return d ? format(d, 'HH:mm dd/MM/yyyy', { locale: vi }) : fallback
}

/** "3 phút trước", "2 ngày trước" */
export function formatRelative(value: string | null | undefined, fallback = '—') {
  const d = parse(value)
  return d ? formatDistanceToNowStrict(d, { addSuffix: true, locale: vi }) : fallback
}

/** Lời chào đầu dashboard: "Thứ Sáu, 06/11/2026" */
export function formatToday() {
  const s = format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const numberFormat = new Intl.NumberFormat('vi-VN')
export const formatNumber = (n: number) => numberFormat.format(n)

/** Dung lượng tệp: "820 KB", "3,4 MB" */
export function formatBytes(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
}

/** Chữ tắt avatar — luôn 2 chữ: hai từ cuối ("Trần Minh Khoa" → "MK"), tên một từ lấy 2 ký tự đầu. */
export function initials(name: string) {
  const parts = (name ?? '').normalize('NFC').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const chars = (s: string) => Array.from(s.replace(/[^\p{L}\p{N}]/gu, '') || s)
  if (parts.length === 1) return chars(parts[0]).slice(0, 2).join('').toUpperCase()
  return ((chars(parts[parts.length - 2])[0] ?? '') + (chars(parts[parts.length - 1])[0] ?? '')).toUpperCase()
}
