import { useState } from 'react'
import { Badge, LinkButton, type Tone } from '@/components/ui'
import type { AdminTeamPost, TeamPostStatus } from '@/types'
import { roleLabel, STATUS_LABEL } from './teamPostLabels'

const STATUS_TONES: Record<TeamPostStatus, Tone> = { open: 'green', closed: 'gray', hidden: 'red' }

export function TeamPostStatusBadge({ status }: { status: TeamPostStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABEL[status]}</Badge>
}

export function RoleChips({ roles }: { roles: string[] }) {
  if (roles.length === 0) return <span className="mo">—</span>
  return (
    <span className="badge-stack">
      {roles.map((r) => (
        <Badge key={r} tone="blue" noDot>
          {roleLabel(r)}
        </Badge>
      ))}
    </span>
  )
}

/** Tiêu đề + đoạn trích; mô tả dài hơn đoạn trích thì mở rộng tại chỗ để đọc đủ khi kiểm duyệt */
export function TeamPostCell({ item }: { item: Pick<AdminTeamPost, 'title' | 'excerpt' | 'description'> }) {
  const [expanded, setExpanded] = useState(false)
  const description = item.description?.trim() ?? ''
  const hasMore = description.length > 0 && description !== item.excerpt.trim()
  return (
    <div className="min-w-0 team-post-cell">
      <div className="entity-title case-title">{item.title}</div>
      <div className={expanded ? 'entity-sub team-post-desc' : 'entity-sub team-post-excerpt'}>{expanded ? description : item.excerpt}</div>
      {hasMore && (
        <LinkButton className="team-post-more" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Thu gọn' : 'Xem đầy đủ'}
        </LinkButton>
      )}
    </div>
  )
}
