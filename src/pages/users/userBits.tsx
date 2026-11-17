import { BadgeCheck, CircleDashed } from 'lucide-react'
import { Badge, type Tone } from '@/components/ui'
import type { RoleRef, UserStatus } from '@/types'
import { STATUS_LABEL } from './userLabels'


const ROLE_TONES: Record<string, Tone> = { admin: 'brand', mentor: 'purple', user: 'gray' }

export function RoleBadge({ role }: { role: Pick<RoleRef, 'code' | 'name'> }) {
  return (
    <Badge tone={ROLE_TONES[role.code] ?? 'blue'} noDot>
      {role.name}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge tone={status === 'active' ? 'green' : 'red'}>{STATUS_LABEL[status]}</Badge>
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge tone="green" icon={BadgeCheck}>
      Đã xác minh
    </Badge>
  ) : (
    <Badge tone="mute" icon={CircleDashed}>
      Chưa xác minh
    </Badge>
  )
}
