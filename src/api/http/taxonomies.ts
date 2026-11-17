import type { Taxonomy, TaxonomyInput, TaxonomyType } from '@/types'
import { request } from './client'

export const taxonomyApi = {
  /** Sắp theo sortOrder rồi tên, kèm caseCount */
  list: (type: TaxonomyType) => request<Taxonomy[]>('/admin/case-taxonomies', { query: { type } }),
  create: (input: TaxonomyInput) => request<Taxonomy>('/admin/case-taxonomies', { method: 'POST', body: input }),
  /** Không đổi được type */
  update: (id: string, input: Partial<Omit<TaxonomyInput, 'type'>>) =>
    request<Taxonomy>(`/admin/case-taxonomies/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<null>(`/admin/case-taxonomies/${id}`, { method: 'DELETE' }),
}
