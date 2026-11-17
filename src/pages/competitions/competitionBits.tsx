import { ImageOff } from 'lucide-react'
import { Badge, Icon, type Tone } from '@/components/ui'
import type { AdminCompetition, CompetitionPhase, CompetitionStatus } from '@/types'
import { PHASE_LABEL, STATUS_LABEL } from './competitionLabels'

const STATUS_TONES: Record<CompetitionStatus, Tone> = { draft: 'gray', published: 'green', hidden: 'red', pending: 'orange', rejected: 'red' }
const PHASE_TONES: Record<CompetitionPhase, Tone> = { soon: 'blue', open: 'green', closing: 'orange', closed: 'gray' }

export function CompetitionStatusBadge({ status }: { status: CompetitionStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABEL[status]}</Badge>
}

export function PhaseBadge({ phase }: { phase: CompetitionPhase }) {
  return <Badge tone={PHASE_TONES[phase]}>{PHASE_LABEL[phase]}</Badge>
}

/** Ảnh bìa nhỏ + tên cuộc thi + đơn vị tổ chức (+ người đề xuất nếu do người dùng gửi) */
export function CompetitionCell({ item }: { item: Pick<AdminCompetition, 'name' | 'organizer' | 'coverUrl' | 'submittedBy'> }) {
  return (
    <div className="case-cell">
      <span className="case-thumb" aria-hidden="true">
        {item.coverUrl ? <img src={item.coverUrl} alt="" loading="lazy" /> : <Icon icon={ImageOff} />}
      </span>
      <div className="min-w-0">
        <div className="entity-title case-title">{item.name}</div>
        <div className="entity-sub">{item.organizer}</div>
        {item.submittedBy && (
          <div className="entity-sub" title={item.submittedBy.email}>
            Đề xuất bởi <b className="ink">{item.submittedBy.fullName}</b>
          </div>
        )}
      </div>
    </div>
  )
}
