import type { CaseSkillWeight, GrowthPreviewRow, Roadmap, SkillOverviewQuery, SkillOverviewRow, UserSkills, RoadmapGoal, RoadmapStep, Skill, SkillGrowth, SkillInput } from '@/types'
import { request, requestPaged } from './client'

type GrowthResponse = { config: SkillGrowth; preview: GrowthPreviewRow[] }

export const skillApi = {
  list: () => request<Skill[]>('/admin/skills'),
  create: (input: SkillInput) => request<Skill>('/admin/skills', { method: 'POST', body: input }),
  update: (id: string, input: SkillInput) => request<Skill>(`/admin/skills/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<null>(`/admin/skills/${id}`, { method: 'DELETE' }),
  growth: () => request<GrowthResponse>('/admin/skills/growth'),
  saveGrowth: (input: SkillGrowth) => request<GrowthResponse>('/admin/skills/growth', { method: 'PUT', body: input }),
  /** Xoá điểm kỹ năng hiện có rồi tính lại từ mọi bài đã trả kết quả */
  recompute: () => request<{ submissions: number }>('/admin/skills/recompute', { method: 'POST' }),
  /** Tổng quan kỹ năng của người học đã có bài được chấm */
  overview: (q: SkillOverviewQuery, signal?: AbortSignal) => requestPaged<SkillOverviewRow>('/admin/skills/users', { query: { ...q }, signal }),
  userSkills: (userId: string) => request<UserSkills>(`/admin/skills/users/${userId}`),
  roadmaps: () => request<Roadmap[]>('/admin/skills/roadmaps'),
  saveRoadmap: (goal: RoadmapGoal, steps: RoadmapStep[]) =>
    request<Roadmap>(`/admin/skills/roadmaps/${goal}`, { method: 'PUT', body: { steps } }),
  caseSkills: (caseId: string) => request<CaseSkillWeight[]>(`/admin/skills/cases/${caseId}`),
  saveCaseSkills: (caseId: string, items: CaseSkillWeight[]) =>
    request<CaseSkillWeight[]>(`/admin/skills/cases/${caseId}`, { method: 'PUT', body: { items } }),
}
