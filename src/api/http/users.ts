import type { CreateUserInput, UpdateUserInput, User, UserListQuery } from '@/types'
import { request, requestPaged } from './client'

export const userApi = {
  list: (q: UserListQuery, signal?: AbortSignal) =>
    requestPaged<User>('/admin/users', { query: { ...q }, signal }),
  get: (id: string) => request<User>(`/admin/users/${id}`),
  create: (input: CreateUserInput) => request<User>('/admin/users', { method: 'POST', body: input }),
  update: (id: string, input: UpdateUserInput) => request<User>(`/admin/users/${id}`, { method: 'PATCH', body: input }),
  resetPassword: (id: string, password: string) =>
    request<null>(`/admin/users/${id}/reset-password`, { method: 'POST', body: { password } }),
  remove: (id: string) => request<null>(`/admin/users/${id}`, { method: 'DELETE' }),
  /** Cấp Premium: `days` cộng nối tiếp hạn hiện tại, hoặc `until` (ISO) đặt đúng ngày hết hạn */
  grantPremium: (id: string, input: { days: number } | { until: string }) =>
    request<User>(`/admin/users/${id}/premium`, { method: 'PUT', body: input }),
  revokePremium: (id: string) => request<User>(`/admin/users/${id}/premium`, { method: 'DELETE' }),
}
