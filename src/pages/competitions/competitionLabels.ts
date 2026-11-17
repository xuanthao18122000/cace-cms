import { format, isValid, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { CompetitionPhase, CompetitionStatus, EditableCompetitionStatus } from '@/types'

export const STATUS_LABEL: Record<CompetitionStatus, string> = {
  draft: 'Nháp',
  published: 'Đã xuất bản',
  hidden: 'Đã ẩn',
  pending: 'Chờ duyệt',
  rejected: 'Đã từ chối',
}
export const PHASE_LABEL: Record<CompetitionPhase, string> = { soon: 'Sắp mở', open: 'Đang mở', closing: 'Sắp hết hạn', closed: 'Đã đóng' }

export const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as CompetitionStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))
/** Đề xuất của người dùng đang chờ / đã bị từ chối: trạng thái chỉ đổi qua nút duyệt, từ chối */
export const isReviewStatus = (s: CompetitionStatus): s is 'pending' | 'rejected' => s === 'pending' || s === 'rejected'
export const isEditableStatus = (s: CompetitionStatus): s is EditableCompetitionStatus => !isReviewStatus(s)

/** Lý do chọn nhanh trong hộp thoại từ chối */
export const REJECT_REASONS = [
  'Thiếu nguồn chính thức để kiểm chứng',
  'Cuộc thi đã hết hạn đăng ký',
  'Trùng với cuộc thi đã có trên CACE',
]
export const REJECT_REASON_MIN = 5
export const REJECT_REASON_MAX = 1000

export const PHASE_OPTIONS = (Object.keys(PHASE_LABEL) as CompetitionPhase[]).map((p) => ({ value: p, label: PHASE_LABEL[p] }))

/** "25/01/2027 23:59" theo giờ máy */
export function formatDeadline(value: string | null | undefined, fallback = '—') {
  if (!value) return fallback
  const d = parseISO(value)
  return isValid(d) ? format(d, 'dd/MM/yyyy HH:mm', { locale: vi }) : fallback
}

/** ISO → giá trị ô datetime-local (giờ địa phương, đến phút) */
export function isoToLocalInput(value: string | null | undefined) {
  if (!value) return ''
  const d = parseISO(value)
  return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : ''
}

/** Giá trị ô datetime-local (giờ địa phương) → ISO UTC; rỗng hoặc sai → null */
export function localInputToIso(value: string) {
  if (!value) return null
  const d = new Date(value)
  return isValid(d) ? d.toISOString() : null
}
