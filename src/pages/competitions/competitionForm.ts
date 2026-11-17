import { z } from 'zod'
import type { AdminCompetition } from '@/types'
import { isoToLocalInput, localInputToIso } from './competitionLabels'

export const SUMMARY_MAX = 500
export const TEAM_MIN = 1
export const TEAM_MAX = 20

const optionalText = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`)
const teamSize = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= TEAM_MIN && Number(v) <= TEAM_MAX), `Từ ${TEAM_MIN} đến ${TEAM_MAX} người`)
const localDate = z.string().refine((v) => v === '' || localInputToIso(v) !== null, 'Thời gian không hợp lệ')
const time = (v: string) => (v ? new Date(v).getTime() : null)

// Khớp luật máy chủ (CompetitionDto) và các kiểm tra chéo: teamMin ≤ teamMax, mở đăng ký < hạn ≤ ngày thi
export const competitionSchema = z
  .object({
    name: z.string().trim().min(3, 'Tên cuộc thi tối thiểu 3 ký tự').max(200, 'Tối đa 200 ký tự'),
    organizer: z.string().trim().min(2, 'Đơn vị tổ chức tối thiểu 2 ký tự').max(200, 'Tối đa 200 ký tự'),
    slug: z
      .string()
      .trim()
      .max(140, 'Tối đa 140 ký tự')
      .refine((v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Chỉ gồm chữ thường không dấu, số và gạch ngang'),
    summary: z.string().trim().min(10, 'Mô tả ngắn tối thiểu 10 ký tự').max(SUMMARY_MAX, `Tối đa ${SUMMARY_MAX} ký tự`),
    field: optionalText(100),
    content: z.string().max(100_000, 'Nội dung quá dài (tối đa 100.000 ký tự HTML)'),
    coverUrl: z.string().nullable(),
    registrationOpensAt: localDate,
    registrationDeadline: z
      .string()
      .min(1, 'Chọn hạn đăng ký')
      .refine((v) => localInputToIso(v) !== null, 'Thời gian không hợp lệ'),
    eventDate: localDate,
    teamMin: teamSize,
    teamMax: teamSize,
    location: optionalText(150),
    prize: optionalText(150),
    registerUrl: z
      .string()
      .trim()
      .max(500, 'Tối đa 500 ký tự')
      .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Link đăng ký phải bắt đầu bằng http:// hoặc https://'),
    // pending/rejected chỉ để hiển thị: trang sửa không gửi hai trạng thái này qua PATCH
    status: z.enum(['draft', 'published', 'hidden', 'pending', 'rejected']),
    isFeatured: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.teamMin && v.teamMax && Number(v.teamMax) < Number(v.teamMin))
      ctx.addIssue({ code: 'custom', path: ['teamMax'], message: 'Số người tối đa phải ≥ số người tối thiểu' })
    const opens = time(v.registrationOpensAt)
    const deadline = time(v.registrationDeadline)
    const event = time(v.eventDate)
    if (opens !== null && deadline !== null && opens >= deadline)
      ctx.addIssue({ code: 'custom', path: ['registrationOpensAt'], message: 'Ngày mở đăng ký phải trước hạn đăng ký' })
    // Máy chủ cho phép ngày thi trùng hạn đăng ký (eventDate ≥ registrationDeadline)
    if (event !== null && deadline !== null && event < deadline)
      ctx.addIssue({ code: 'custom', path: ['eventDate'], message: 'Ngày thi không được trước hạn đăng ký' })
  })
export type CompetitionFormValues = z.infer<typeof competitionSchema>

export const COMPETITION_FIELDS = [
  'name',
  'organizer',
  'slug',
  'summary',
  'field',
  'content',
  'coverUrl',
  'registrationOpensAt',
  'registrationDeadline',
  'eventDate',
  'teamMin',
  'teamMax',
  'location',
  'prize',
  'registerUrl',
  'status',
  'isFeatured',
] as const

export const toCompetitionValues = (c: AdminCompetition | null, keep?: { content: string }): CompetitionFormValues => ({
  name: c?.name ?? '',
  organizer: c?.organizer ?? '',
  slug: c?.slug ?? '',
  summary: c?.summary ?? '',
  field: c?.field ?? '',
  content: keep?.content ?? c?.content ?? '',
  coverUrl: c?.coverUrl ?? null,
  registrationOpensAt: isoToLocalInput(c?.registrationOpensAt),
  registrationDeadline: isoToLocalInput(c?.registrationDeadline),
  eventDate: isoToLocalInput(c?.eventDate),
  teamMin: c?.teamMin ? String(c.teamMin) : '',
  teamMax: c?.teamMax ? String(c.teamMax) : '',
  location: c?.location ?? '',
  prize: c?.prize ?? '',
  registerUrl: c?.registerUrl ?? '',
  status: c?.status ?? 'draft',
  isFeatured: c?.isFeatured ?? false,
})
