import { z } from 'zod'
import type { AdminCompetition, CompetitionInput } from '@/types'
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
const vnd = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{1,12}$/.test(v.replace(/[.,\s]/g, '')), 'Nhập số tiền (VND)')
const roundSchema = z.object({
  name: z.string().trim().min(2, 'Nhập tên vòng thi').max(150, 'Tối đa 150 ký tự'),
  format: z.string().trim().min(2, 'Chọn hình thức').max(150),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Chọn ngày kết thúc'),
  description: z.string().trim().max(500, 'Tối đa 500 ký tự'),
})
export type RoundValues = z.infer<typeof roundSchema>
export const emptyRound: RoundValues = { name: '', format: '', startDate: '', endDate: '', description: '' }
/** "30.000.000" → 30000000; rỗng → null */
export const parseVnd = (v: string) => {
  const d = v.replace(/[.,\s]/g, '')
  return d ? Number(d) : null
}

// Khớp luật máy chủ (CompetitionDto) và các kiểm tra chéo: teamMin ≤ teamMax, mở đăng ký < hạn ≤ ngày thi
export const competitionSchema = z
  .object({
    name: z.string().trim().min(3, 'Tên cuộc thi tối thiểu 3 ký tự').max(255, 'Tối đa 255 ký tự'),
    organizer: z.string().trim().min(2, 'Đơn vị tổ chức tối thiểu 2 ký tự').max(255, 'Tối đa 255 ký tự'),
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
    eventStartDate: localDate,
    audience: z.enum(['', 'university', 'highschool', 'all']),
    format: z.enum(['', 'online', 'offline', 'hybrid']),
    participation: z.enum(['', 'individual', 'team', 'both']),
    scale: z.enum(['', 'school', 'south', 'north', 'central', 'national']),
    rounds: z.array(roundSchema).max(10, 'Tối đa 10 vòng thi'),
    prizeFirst: vnd,
    prizeSecond: vnd,
    prizeThird: vnd,
    prizeNote: optionalText(300),
    contactName: optionalText(120),
    contactRole: optionalText(80),
    contactPhone: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\+?[\d\s.-]{8,20}$/.test(v), 'Số điện thoại không hợp lệ'),
    contactEmail: z
      .string()
      .trim()
      .max(255)
      .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email không hợp lệ'),
    contactAddress: optionalText(300),
    fanpageUrl: z
      .string()
      .trim()
      .max(500, 'Tối đa 500 ký tự')
      .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Link phải bắt đầu bằng http:// hoặc https://'),
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
    const start = time(v.eventStartDate)
    if (start !== null && event !== null && start > event)
      ctx.addIssue({ code: 'custom', path: ['eventStartDate'], message: 'Ngày bắt đầu phải trước ngày kết thúc' })
    v.rounds.forEach((r, i) => {
      const a = time(r.startDate)
      const b = time(r.endDate)
      if (a !== null && b !== null && a > b) ctx.addIssue({ code: 'custom', path: ['rounds', i, 'endDate'], message: 'Phải sau ngày bắt đầu' })
    })
    // Giải thưởng: nhập một thì nhập đủ ba
    const prizes = [v.prizeFirst, v.prizeSecond, v.prizeThird]
    if (prizes.some(Boolean) || v.prizeNote)
      (['prizeFirst', 'prizeSecond', 'prizeThird'] as const).forEach((k) => {
        if (!v[k]) ctx.addIssue({ code: 'custom', path: [k], message: 'Nhập đủ giải Nhất, Nhì, Ba' })
      })
    // Liên hệ BTC: nhập một thì nhập đủ
    const contact = ['contactName', 'contactRole', 'contactPhone', 'contactEmail', 'contactAddress'] as const
    if (contact.some((k) => v[k]))
      contact.forEach((k) => {
        if (!v[k]) ctx.addIssue({ code: 'custom', path: [k], message: 'Nhập đủ thông tin liên hệ' })
      })
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
  'eventStartDate',
  'audience',
  'format',
  'participation',
  'scale',
  'rounds',
  'fanpageUrl',
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
  eventStartDate: isoToLocalInput(c?.eventStartDate),
  audience: c?.audience ?? '',
  format: c?.format ?? '',
  participation: c?.participation ?? '',
  scale: c?.scale ?? '',
  rounds: (c?.rounds ?? []).map((r) => ({
    name: r.name,
    format: r.format,
    startDate: isoToLocalInput(r.startDate),
    endDate: isoToLocalInput(r.endDate),
    description: r.description ?? '',
  })),
  prizeFirst: c?.prizes ? String(c.prizes.first) : '',
  prizeSecond: c?.prizes ? String(c.prizes.second) : '',
  prizeThird: c?.prizes ? String(c.prizes.third) : '',
  prizeNote: c?.prizes?.note ?? '',
  contactName: c?.contact?.name ?? '',
  contactRole: c?.contact?.role ?? '',
  contactPhone: c?.contact?.phone ?? '',
  contactEmail: c?.contact?.email ?? '',
  contactAddress: c?.contact?.address ?? '',
  fanpageUrl: c?.fanpageUrl ?? '',
})

/** Phần body cho các trường mới (phân loại, vòng thi, giải, liên hệ BTC) */
export const extrasToInput = (v: CompetitionFormValues): Partial<CompetitionInput> => {
  const first = parseVnd(v.prizeFirst)
  const second = parseVnd(v.prizeSecond)
  const third = parseVnd(v.prizeThird)
  const t = (s: string) => (s.trim() ? s.trim() : null)
  return {
    eventStartDate: localInputToIso(v.eventStartDate),
    audience: v.audience || null,
    format: v.format || null,
    participation: v.participation || null,
    scale: v.scale || null,
    rounds: v.rounds.length
      ? v.rounds.map((r) => ({
          name: r.name.trim(),
          format: r.format.trim(),
          startDate: localInputToIso(r.startDate) ?? '',
          endDate: localInputToIso(r.endDate) ?? '',
          description: t(r.description),
        }))
      : null,
    prizes: first !== null && second !== null && third !== null ? { first, second, third, note: t(v.prizeNote) } : null,
    contact: v.contactName.trim()
      ? {
          name: v.contactName.trim(),
          role: v.contactRole.trim(),
          phone: v.contactPhone.trim(),
          email: v.contactEmail.trim(),
          address: v.contactAddress.trim(),
        }
      : null,
    fanpageUrl: t(v.fanpageUrl),
  }
}

/** Tổng 3 giải từ giá trị form; null nếu thiếu */
export function prizeTotalOf(v: Pick<CompetitionFormValues, 'prizeFirst' | 'prizeSecond' | 'prizeThird'>) {
  const a = [v.prizeFirst, v.prizeSecond, v.prizeThird].map(parseVnd)
  return a.every((x) => x !== null) ? (a as number[]).reduce((s, x) => s + x, 0) : null
}
