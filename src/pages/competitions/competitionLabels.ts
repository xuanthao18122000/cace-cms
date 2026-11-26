import { format, isValid, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import type {
  CompetitionAudience,
  CompetitionFormat,
  CompetitionParticipation,
  CompetitionPhase,
  CompetitionScale,
  CompetitionStatus,
  EditableCompetitionStatus,
} from '@/types'

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
export function formatDeadline(value: string | null | undefined, fallback = '-') {
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

// ── Phân loại cuộc thi (khớp competition.constants của API) ──

export const AUDIENCE_LABEL: Record<CompetitionAudience, string> = {
  university: 'Sinh viên đại học',
  highschool: 'Học sinh THPT',
  all: 'Tất cả học sinh, sinh viên',
}
export const FORMAT_LABEL: Record<CompetitionFormat, string> = { online: 'Online', offline: 'Offline', hybrid: 'Hybrid' }
export const PARTICIPATION_LABEL: Record<CompetitionParticipation, string> = { individual: 'Cá nhân', team: 'Nhóm', both: 'Cá nhân hoặc nhóm' }
export const SCALE_LABEL: Record<CompetitionScale, string> = {
  school: 'Cấp trường',
  south: 'Miền Nam',
  north: 'Miền Bắc',
  central: 'Miền Trung',
  national: 'Toàn quốc',
}
const opts = <K extends string>(m: Record<K, string>) => [{ value: '', label: 'Chưa chọn' }, ...(Object.keys(m) as K[]).map((k) => ({ value: k, label: m[k] }))]
export const AUDIENCE_OPTIONS = opts(AUDIENCE_LABEL)
export const FORMAT_OPTIONS = opts(FORMAT_LABEL)
export const PARTICIPATION_OPTIONS = opts(PARTICIPATION_LABEL)
export const SCALE_OPTIONS = opts(SCALE_LABEL)

/** Lĩnh vực chuẩn - dùng cho bộ lọc web và Theo dõi lĩnh vực */
export const COMPETITION_FIELD_OPTIONS = [
  'Kinh doanh - Chiến lược',
  'Marketing',
  'Tài chính',
  'Nhân sự',
  'Công nghệ / Dữ liệu',
  'ESG / Phát triển bền vững',
  'Khác',
]

export const ROUND_FORMATS = [
  'Phân tích case và đề xuất giải pháp',
  'Thuyết trình trước hội đồng',
  'Bài thi trắc nghiệm / kiến thức',
  'Phỏng vấn',
  'Workshop / Bootcamp',
  'Khác',
]

export const CONTACT_ROLES = ['Trưởng ban Tổ chức', 'Phó ban Tổ chức', 'Thành viên BTC', 'Phụ trách truyền thông', 'Phụ trách đối ngoại', 'Khác']

/** 30000000 → "30.000.000 ₫" */
export const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')} ₫`
