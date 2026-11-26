import type { XpRules } from '@/types'
import { request } from './client'

export const xpRulesApi = {
  get: () => request<XpRules>('/admin/leaderboard/rules'),
  /** `reapply`: tính lại toàn bộ sổ XP theo luật mới (chạy nền ở worker) */
  save: (rules: XpRules, reapply = false) => request<XpRules>('/admin/leaderboard/rules', { method: 'PUT', body: { ...rules, reapply } }),
}
