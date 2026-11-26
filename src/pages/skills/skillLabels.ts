import type { RoadmapAction, RoadmapGoal, SkillGrowth } from '@/types'

export const GOALS: { value: RoadmapGoal; label: string; hint: string }[] = [
  { value: 'competition', label: 'Thi case', hint: 'Chuẩn bị và luyện tập cho các cuộc thi business case' },
  { value: 'mt', label: 'Apply intern / MT', hint: 'Chuẩn bị cho chương trình thực tập và Management Trainee' },
  { value: 'practice', label: 'Nâng skill', hint: 'Phát triển kỹ năng và kiến thức về marketing, business…' },
]

export const ACTION_OPTIONS: { value: RoadmapAction; label: string }[] = [
  { value: 'cases', label: 'Mở Rèn luyện (chọn case)' },
  { value: 'co_solving', label: 'Mở Giải case nhóm' },
  { value: 'competitions', label: 'Mở Cuộc thi' },
  { value: 'profile', label: 'Mở hồ sơ / CV' },
]

export const DIFFICULTY_LABEL = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' } as const

/** Icon lucide gợi ý cho kỹ năng (web hiển thị theo tên). */
export const ICON_OPTIONS = [
  'search',
  'lightbulb',
  'users',
  'palette',
  'book-open',
  'bar-chart-3',
  'presentation',
  'message-circle',
  'target',
  'calculator',
  'pen-tool',
  'globe',
  'sparkles',
].map((v) => ({ value: v, label: v }))

/** Cùng công thức với API (`skillDelta`) để xem trước ngay khi sửa số. */
export function skillDelta(
  cfg: SkillGrowth,
  input: { current: number; score: number; difficulty: 'easy' | 'medium' | 'hard'; weight: number; repeat?: boolean; group?: boolean },
): number {
  const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))
  const perf = clamp(input.score * 10 * cfg.difficulty[input.difficulty])
  let raw = cfg.learningRate * (clamp(input.weight, 1, 3) / 3) * (perf - input.current)
  if (input.repeat) raw *= cfg.repeatFactor
  if (input.group) raw *= cfg.groupFactor
  const delta = raw >= 0 ? Math.min(raw, cfg.maxGain) : Math.max(raw * cfg.lossFactor, -cfg.maxLoss)
  return Math.round(delta * 10) / 10
}
