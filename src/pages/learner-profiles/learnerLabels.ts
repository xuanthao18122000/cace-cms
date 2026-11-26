import type { LearnerReviewStatus, LearnerType, RoadmapGoal } from '@/types'

export const GOAL_LABEL: Record<RoadmapGoal, string> = {
  competition: 'Thi case',
  mt: 'Apply intern / MT',
  practice: 'Nâng skill',
}

export const LEARNER_TYPE_LABEL: Record<LearnerType, string> = {
  university: 'Sinh viên đại học',
  high_school: 'Học sinh THPT',
  working: 'Người đi làm',
}

export const REVIEW_LABEL: Record<LearnerReviewStatus, string> = {
  none: 'Chưa gửi',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

export const REVIEW_TONE = { none: 'gray', pending: 'orange', approved: 'green', rejected: 'red' } as const
