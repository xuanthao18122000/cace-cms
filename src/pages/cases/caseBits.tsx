import { ImageOff, Star } from 'lucide-react'
import { Badge, Icon, type Tone } from '@/components/ui'
import type { AdminCaseItem, CaseStatus, Difficulty } from '@/types'
import { DIFFICULTY_LABEL, STATUS_LABEL } from './caseLabels'

const DIFFICULTY_TONES: Record<Difficulty, Tone> = { easy: 'green', medium: 'yellow', hard: 'red' }
const STATUS_TONES: Record<CaseStatus, Tone> = { draft: 'gray', published: 'green', hidden: 'red' }

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge tone={DIFFICULTY_TONES[difficulty]} noDot>
      {DIFFICULTY_LABEL[difficulty]}
    </Badge>
  )
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABEL[status]}</Badge>
}

export function FeaturedStar({ featured }: { featured: boolean }) {
  return (
    <span className={featured ? 'star on' : 'star'} title={featured ? 'Nổi bật' : 'Không nổi bật'}>
      <Icon icon={Star} />
      <span className="sr-only">{featured ? 'Nổi bật' : 'Không nổi bật'}</span>
    </span>
  )
}

/** Ảnh bìa nhỏ + tiêu đề + đường dẫn */
export function CaseCell({ item }: { item: Pick<AdminCaseItem, 'title' | 'slug' | 'coverUrl'> }) {
  return (
    <div className="case-cell">
      <span className="case-thumb" aria-hidden="true">
        {item.coverUrl ? <img src={item.coverUrl} alt="" loading="lazy" /> : <Icon icon={ImageOff} />}
      </span>
      <div className="min-w-0">
        <div className="entity-title case-title">{item.title}</div>
        <div className="entity-sub mono">{item.slug}</div>
      </div>
    </div>
  )
}
