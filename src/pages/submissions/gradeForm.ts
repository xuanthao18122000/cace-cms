import { z } from 'zod'
import type { AdminSubmissionDetail, Criterion } from '@/types'

export const COMMENT_MAX = 2000
export const FEEDBACK_MAX = 5000

// Khớp luật máy chủ (GradeSubmissionDto): điểm 0..maxScore, tối đa 1 chữ số thập phân
export const gradeSchema = (criteria: Criterion[]) =>
  z
    .object({
      items: z.array(
        z.object({
          criterionId: z.string(),
          score: z.string().trim().min(1, 'Nhập điểm'),
          comment: z.string().trim().max(COMMENT_MAX, `Tối đa ${COMMENT_MAX} ký tự`),
        }),
      ),
      feedback: z.string().trim().max(FEEDBACK_MAX, `Tối đa ${FEEDBACK_MAX} ký tự`),
    })
    .superRefine((v, ctx) => {
      v.items.forEach((item, i) => {
        if (!item.score) return
        const max = criteria.find((c) => c.id === item.criterionId)?.maxScore ?? 10
        const n = Number(item.score.replace(',', '.'))
        let message: string | null = null
        if (!Number.isFinite(n)) message = 'Điểm phải là số'
        else if (n < 0 || n > max) message = `Từ 0 đến ${max}`
        else if (Math.round(n * 10) !== n * 10) message = 'Tối đa 1 chữ số thập phân'
        if (message) ctx.addIssue({ code: 'custom', path: ['items', i, 'score'], message })
      })
    })

export type GradeFormValues = z.infer<ReturnType<typeof gradeSchema>>

export const parseScore = (v: string) => {
  const t = v.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Giá trị form theo thứ tự tiêu chí; điểm đã chấm (kể cả nháp) được nạp sẵn */
export const toGradeValues = (s: AdminSubmissionDetail, criteria: Criterion[]): GradeFormValues => ({
  items: criteria.map((c) => {
    const g = s.grade?.items.find((x) => x.criterionId === c.id)
    return { criterionId: c.id, score: g ? String(g.score) : '', comment: g?.comment ?? '' }
  }),
  feedback: s.grade?.feedback ?? '',
})

/**
 * Điểm tổng như máy chủ: Σ (điểm / thang) × trọng số → % (trọng số tổng 100) → chia 10, làm tròn 1 chữ số.
 * Trả null khi còn tiêu chí chưa nhập hoặc điểm không hợp lệ.
 */
export function computeTotal(criteria: Criterion[], items: { criterionId: string; score: string }[]): number | null {
  let pct = 0
  for (const c of criteria) {
    const n = parseScore(items.find((x) => x.criterionId === c.id)?.score ?? '')
    if (n === null || n < 0 || n > c.maxScore) return null
    pct += (n / c.maxScore) * c.weight
  }
  // (pct / 10) làm tròn 1 chữ số thập phân = round(pct) / 10
  // Khử sai số dấu phẩy động trước khi làm tròn (vd 76,4999999 → 76,5)
  return Math.round(Number(pct.toFixed(6))) / 10
}
