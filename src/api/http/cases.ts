import type { AdminCase, AdminCaseItem, CaseInput, CaseListQuery } from '@/types'
import { request, requestPaged } from './client'

export const caseApi = {
  list: (q: CaseListQuery, signal?: AbortSignal) => requestPaged<AdminCaseItem>('/admin/cases', { query: { ...q }, signal }),
  get: (id: string) => request<AdminCase>(`/admin/cases/${id}`),
  create: (input: CaseInput) => request<AdminCase>('/admin/cases', { method: 'POST', body: input }),
  update: (id: string, input: Partial<CaseInput>) => request<AdminCase>(`/admin/cases/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<null>(`/admin/cases/${id}`, { method: 'DELETE' }),
}
