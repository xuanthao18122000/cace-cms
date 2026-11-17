import type { AdminSubmission, AdminSubmissionDetail, GradeInput, SubmissionListQuery } from '@/types'
import { request, requestPaged } from './client'

export const submissionApi = {
  list: (q: SubmissionListQuery, signal?: AbortSignal) =>
    requestPaged<AdminSubmission>('/admin/submissions', { query: { ...q }, signal }),
  get: (id: string) => request<AdminSubmissionDetail>(`/admin/submissions/${id}`),
  /** Lưu nháp (publish=false) hoặc trả kết quả (publish=true) */
  grade: (id: string, body: GradeInput) => request<AdminSubmissionDetail>(`/admin/submissions/${id}/grade`, { method: 'PUT', body }),
}
