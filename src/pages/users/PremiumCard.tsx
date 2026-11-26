import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Crown, ShieldOff } from 'lucide-react'
import { errorMessage, userApi } from '@/api'
import { Badge, Button, Card, ConfirmDialog, DateTimePicker, Dialog, Field, KeyValueGrid } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { User } from '@/types'
import { formatDateTime, formatRelative } from '@/utils/format'

const DAY_OPTIONS = [30, 90, 365] as const
const DAY_MS = 86_400_000

/** Thẻ "Gói Premium" ở trang chi tiết người dùng: cấp 30 / 90 / 365 ngày hoặc chọn ngày, thu hồi. Chỉ admin gọi được API. */
export function PremiumCard({ user }: { user: User }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [picking, setPicking] = useState(false)
  const [until, setUntil] = useState('')
  const [revoking, setRevoking] = useState(false)
  // Mốc "bây giờ" cố định cho lần hiển thị (tránh gọi Date.now() trong render)
  const [now] = useState(() => Date.now())

  const active = !!user.isPremium
  const expiry = user.premiumUntil ?? null
  const expired = !active && !!expiry
  const daysLeft = active && expiry ? Math.max(1, Math.ceil((new Date(expiry).getTime() - now) / DAY_MS)) : 0

  const done = (saved: User, message: string) => {
    queryClient.setQueryData(queryKeys.user(saved.id), saved)
    queryClient.invalidateQueries({ queryKey: queryKeys.users })
    toast.success(message)
  }

  const grant = useMutation({
    mutationFn: (input: { days: number } | { until: string }) => userApi.grantPremium(user.id, input),
    onSuccess: (saved) => {
      setPicking(false)
      setUntil('')
      done(saved, `Đã cấp Premium cho ${saved.fullName} tới ${saved.premiumUntil ? formatDateTime(saved.premiumUntil) : ''}`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const revoke = useMutation({
    mutationFn: () => userApi.revokePremium(user.id),
    onSuccess: (saved) => {
      setRevoking(false)
      done(saved, `Đã thu hồi Premium của ${saved.fullName}`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const submitPicked = () => {
    const d = until ? new Date(until) : null
    if (!d || Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      toast.error('Chọn ngày hết hạn ở tương lai')
      return
    }
    grant.mutate({ until: d.toISOString() })
  }

  return (
    <Card
      icon={Crown}
      title="Gói Premium"
      subtitle={active ? 'Cấp thêm ngày sẽ cộng nối tiếp hạn hiện tại' : 'Freemium chỉ xem được 3 case miễn phí mỗi mức độ'}
    >
      <KeyValueGrid
        columns={2}
        items={[
          {
            label: 'Trạng thái',
            value: active ? (
              <Badge tone="yellow" icon={Crown}>
                Premium · còn {daysLeft} ngày
              </Badge>
            ) : expired ? (
              <Badge tone="red">Đã hết hạn</Badge>
            ) : (
              <Badge tone="gray">Freemium</Badge>
            ),
          },
          {
            label: 'Hết hạn',
            value: expiry ? `${formatDateTime(expiry)} · ${formatRelative(expiry)}` : <span className="mo">Chưa có</span>,
          },
        ]}
      />
      <div className="row" style={{ marginTop: 16 }}>
        {DAY_OPTIONS.map((days) => (
          <Button
            key={days}
            icon={CalendarPlus}
            variant={days === 30 ? 'primary' : 'secondary'}
            loading={grant.isPending && !!grant.variables && 'days' in grant.variables && grant.variables.days === days}
            disabled={grant.isPending || revoke.isPending}
            onClick={() => grant.mutate({ days })}
          >
            Cấp {days} ngày
          </Button>
        ))}
        <Button disabled={grant.isPending || revoke.isPending} onClick={() => setPicking(true)}>
          Chọn ngày…
        </Button>
        {active && (
          <Button icon={ShieldOff} variant="danger-outline" disabled={grant.isPending} onClick={() => setRevoking(true)}>
            Thu hồi
          </Button>
        )}
      </div>

      <Dialog
        open={picking}
        title="Cấp Premium tới ngày"
        description="Người dùng xem được toàn bộ case cho tới thời điểm này."
        submitLabel="Cấp Premium"
        busy={grant.isPending}
        onClose={() => setPicking(false)}
        onSubmit={submitPicked}
      >
        <Field label="Ngày hết hạn" htmlFor="premium-until" required>
          <DateTimePicker id="premium-until" value={until} onChange={setUntil} defaultTime="23:59" placeholder="Chọn ngày" />
        </Field>
      </Dialog>

      <ConfirmDialog
        open={revoking}
        title="Thu hồi gói Premium?"
        message={`${user.fullName} sẽ quay về freemium ngay lập tức (bài đã làm vẫn giữ).`}
        confirmLabel="Thu hồi"
        danger
        busy={revoke.isPending}
        onConfirm={() => revoke.mutate()}
        onClose={() => setRevoking(false)}
      />
    </Card>
  )
}
