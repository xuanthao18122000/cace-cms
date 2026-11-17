import { z } from 'zod'
import type { AdminCase, CriterionInput } from '@/types'

export const SUMMARY_MAX = 500
export const CRITERIA_MIN = 1
export const CRITERIA_MAX = 10
export const DEFAULT_MAX_ATTEMPTS = 3
export const DEFAULT_EDIT_WINDOW = 30

/** Số nguyên dạng chuỗi trong khoảng [min, max] */
const intIn = (v: string, min: number, max: number) => /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max

// Khớp luật máy chủ: 1–10 tiêu chí, weight 1–100, tổng 100, maxScore 1–100
const criterionSchema = z.object({
  name: z.string().trim().min(2, 'Tối thiểu 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  description: z.string().trim().max(500, 'Tối đa 500 ký tự'),
  weight: z.string().trim().refine((v) => intIn(v, 1, 100), 'Từ 1 đến 100'),
  maxScore: z.string().trim().refine((v) => intIn(v, 1, 100), 'Từ 1 đến 100'),
})
export type CriterionValues = z.infer<typeof criterionSchema>

export const isValidMaxAttempts = (v: string) => intIn(v.trim(), 1, 20)

export const sumWeights = (list: { weight: string }[]) => list.reduce((s, c) => s + (Number(c.weight) || 0), 0)

export const caseSchema = z.object({
  title: z.string().trim().min(5, 'Tiêu đề tối thiểu 5 ký tự').max(200, 'Tối đa 200 ký tự'),
  slug: z
    .string()
    .trim()
    .max(200, 'Tối đa 200 ký tự')
    .refine((v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Chỉ gồm chữ thường không dấu, số và gạch ngang'),
  summary: z.string().trim().min(10, 'Tóm tắt tối thiểu 10 ký tự').max(SUMMARY_MAX, `Tối đa ${SUMMARY_MAX} ký tự`),
  content: z.string().max(200_000, 'Nội dung quá dài (tối đa 200.000 ký tự HTML)'),
  company: z.string().trim().max(120, 'Tối đa 120 ký tự'),
  coverUrl: z.string().nullable(),
  pdf: z.object({ url: z.string(), name: z.string(), size: z.number().nullable() }).nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedMinutes: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 5 && Number(v) <= 600), 'Từ 5 đến 600 phút'),
  fieldId: z.string(),
  industryId: z.string(),
  levelId: z.string(),
  status: z.enum(['draft', 'published', 'hidden']),
  isFeatured: z.boolean(),
  // Làm bài
  unlimitedAttempts: z.boolean(),
  // Bật "Không giới hạn" thì ô số bị khoá và luôn giữ giá trị hợp lệ (xem SubmitSettings)
  maxAttempts: z
    .string()
    .trim()
    .refine(isValidMaxAttempts, 'Từ 1 đến 20 lần'),
  editWindowMinutes: z
    .string()
    .trim()
    .refine((v) => intIn(v, 0, 1440), 'Từ 0 đến 1440 phút'),
  criteria: z
    .array(criterionSchema)
    .min(CRITERIA_MIN, 'Cần ít nhất 1 tiêu chí')
    .max(CRITERIA_MAX, `Tối đa ${CRITERIA_MAX} tiêu chí`)
    .refine((list) => sumWeights(list) === 100, 'Tổng trọng số phải bằng 100%')
  .refine((list) => new Set(list.map((c) => c.name.trim().toLowerCase())).size === list.length, 'Tên các tiêu chí không được trùng nhau'),
  solutionContent: z.string().max(200_000, 'Nội dung quá dài (tối đa 200.000 ký tự HTML)'),
  solutionPdf: z.object({ url: z.string(), name: z.string(), size: z.number().nullable() }).nullable(),
})
export type CaseFormValues = z.infer<typeof caseSchema>

export const CASE_FIELDS = [
  'title',
  'slug',
  'summary',
  'content',
  'company',
  'coverUrl',
  'pdf',
  'difficulty',
  'estimatedMinutes',
  'fieldId',
  'industryId',
  'levelId',
  'status',
  'isFeatured',
  'maxAttempts',
  'editWindowMinutes',
  'solutionContent',
  'solutionPdf',
] as const
export const CASE_SERVER_ALIAS = {
  pdfUrl: 'pdf',
  pdfName: 'pdf',
  pdfSize: 'pdf',
  solutionPdfUrl: 'solutionPdf',
  solutionPdfName: 'solutionPdf',
} as const

/** 4 tiêu chí mặc định giống máy chủ: Rõ ràng / Logic / Bằng chứng / Cấu trúc, mỗi tiêu chí 25%, thang 10 */
export const DEFAULT_CRITERIA: CriterionValues[] = ['Rõ ràng', 'Logic', 'Bằng chứng', 'Cấu trúc'].map((name) => ({
  name,
  description: '',
  weight: '25',
  maxScore: '10',
}))

export const emptyCriterion = (): CriterionValues => ({ name: '', description: '', weight: '', maxScore: '10' })

/** Chia đều 100% cho n tiêu chí, phần dư dồn vào các tiêu chí đầu */
export function evenWeights(n: number): number[] {
  const base = Math.floor(100 / n)
  return Array.from({ length: n }, (_, i) => base + (i < 100 - base * n ? 1 : 0))
}

export const toCriteriaInput = (list: CriterionValues[]): CriterionInput[] =>
  list.map((c) => ({
    name: c.name.trim(),
    description: c.description.trim() || null,
    weight: Number(c.weight),
    maxScore: Number(c.maxScore),
  }))

/** So tiêu chí đang soạn với bản đã lưu: chỉ gửi khi khác để tránh CACE_CRITERIA_LOCKED */
export const sameCriteria = (a: CriterionValues[], b: CriterionValues[]) =>
  JSON.stringify(toCriteriaInput(a)) === JSON.stringify(toCriteriaInput(b))

export const toCaseValues = (c: AdminCase | null, keep?: { content: string; solutionContent: string }): CaseFormValues => ({
  title: c?.title ?? '',
  slug: c?.slug ?? '',
  summary: c?.summary ?? '',
  content: keep?.content ?? c?.content ?? '',
  company: c?.company ?? '',
  coverUrl: c?.coverUrl ?? null,
  pdf: c?.pdfUrl ? { url: c.pdfUrl, name: c.pdfName || 'de-bai.pdf', size: c.pdfSize } : null,
  difficulty: c?.difficulty ?? 'medium',
  estimatedMinutes: c?.estimatedMinutes ? String(c.estimatedMinutes) : '',
  fieldId: c?.field?.id ?? '',
  industryId: c?.industry?.id ?? '',
  levelId: c?.level?.id ?? '',
  status: c?.status ?? 'draft',
  isFeatured: c?.isFeatured ?? false,
  unlimitedAttempts: c ? c.maxAttempts === null : false,
  maxAttempts: String(c?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS),
  editWindowMinutes: String(c?.editWindowMinutes ?? DEFAULT_EDIT_WINDOW),
  criteria: c?.criteria?.length
    ? [...c.criteria]
        .sort((x, y) => x.sortOrder - y.sortOrder)
        .map((k) => ({ name: k.name, description: k.description ?? '', weight: String(k.weight), maxScore: String(k.maxScore) }))
    : DEFAULT_CRITERIA,
  solutionContent: keep?.solutionContent ?? c?.solutionContent ?? '',
  solutionPdf: c?.solutionPdfUrl ? { url: c.solutionPdfUrl, name: c.solutionPdfName || 'dan-giai.pdf', size: null } : null,
})
