import { BadgeCheck, CircleDashed, Crown } from 'lucide-react'
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

/** Huy hiệu Premium (chỉ hiện khi gói còn hạn) */
export function PremiumBadge({ user }: { user: { isPremium?: boolean; premiumUntil?: string | null } }) {
  if (!user.isPremium) return null
  const until = user.premiumUntil ? new Date(user.premiumUntil).toLocaleDateString('vi-VN') : null
  return (
    <Badge tone="yellow" icon={Crown} title={until ? `Premium tới ${until}` : 'Premium'}>
      Premium
    </Badge>
  )
}
