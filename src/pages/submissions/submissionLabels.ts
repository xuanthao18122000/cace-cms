import type { SubmissionStatus } from '@/types'

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft: 'Nháp',
  submitted: 'Đã nộp',
  grading: 'Đang chấm',
  graded: 'Đã chấm',
}

export const SUBMISSION_STATUS_OPTIONS = (Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((s) => ({
  value: s,
  label: SUBMISSION_STATUS_LABEL[s],
}))

/** Điểm thập phân kiểu Việt: 7,5 */
export const formatScore = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

/** Điểm chấm thang 10, luôn một chữ số thập phân: 7,6 · 8,0 */
export const formatGrade = (n: number) => n.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
