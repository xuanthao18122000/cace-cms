import type { Paged } from '@/types'
import { request, requestPaged } from './client'

export type SupportReportType = 'report' | 'feedback'
export type SupportReportStatus = 'new' | 'done'

/** Báo cáo vấn đề / góp ý tính năng người học gửi từ web (Hồ sơ → Cài đặt → Hỗ trợ & Báo cáo) */
export interface SupportReport {
  id: string
  type: SupportReportType
  /** Mã loại vấn đề / nhóm góp ý (web gửi) */
  category: string
  /** Mã khu vực xảy ra (chỉ báo cáo vấn đề) */
  area: string | null
  description: string
  attachmentUrl: string | null
  attachmentName: string | null
  /** Email nhận phản hồi */
  email: string
  status: SupportReportStatus
  user: { id: string; fullName: string; email: string } | null
  resolvedAt: string | null
  createdAt: string
}

export interface SupportReportQuery {
  page: number
  pageSize: number
  type?: SupportReportType
  status?: SupportReportStatus
  search?: string
}

export const supportReportApi = {
  list: (q: SupportReportQuery, signal?: AbortSignal): Promise<Paged<SupportReport>> =>
    requestPaged<SupportReport>('/admin/support-reports', { query: { ...q }, signal }),
  setStatus: (id: string, status: SupportReportStatus) =>
    request<SupportReport>(`/admin/support-reports/${id}`, { method: 'PATCH', body: { status } }),
}
