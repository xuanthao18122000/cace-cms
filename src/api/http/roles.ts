import type { Role, RoleInput } from '@/types'
import { request } from './client'

export const roleApi = {
  list: (search?: string) => request<Role[]>('/admin/roles', { query: { search } }),
  get: (id: string) => request<Role>(`/admin/roles/${id}`),
  create: (input: RoleInput) => request<Role>('/admin/roles', { method: 'POST', body: input }),
  /** Mã vai không đổi sau khi tạo */
  update: (id: string, input: Omit<RoleInput, 'code'>) => request<Role>(`/admin/roles/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<null>(`/admin/roles/${id}`, { method: 'DELETE' }),
}
