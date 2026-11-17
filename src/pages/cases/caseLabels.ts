import { config } from '@/config'
import type { CaseStatus, Difficulty, TaxonomyType } from '@/types'

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }
export const STATUS_LABEL: Record<CaseStatus, string> = { draft: 'Nháp', published: 'Đã xuất bản', hidden: 'Đã ẩn' }
export const TAXONOMY_LABEL: Record<TaxonomyType, string> = { field: 'Lĩnh vực', industry: 'Ngành', level: 'Level' }
export const TAXONOMY_TYPES: TaxonomyType[] = ['field', 'industry', 'level']

export const DIFFICULTY_OPTIONS = (Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))
export const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as CaseStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))

/** Trang case trên web người học (chỉ mở được khi đã xuất bản) */
export const caseWebUrl = (slug: string) => `${config.webUrl}/ren-luyen/${slug}`
