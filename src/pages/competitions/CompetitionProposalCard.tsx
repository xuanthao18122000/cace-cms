import { BadgeCheck, Check, CircleX, Inbox } from 'lucide-react'
import { Button, Card, Icon, InfoBox, KeyValueGrid, type KeyValueItem } from '@/components/ui'
import type { AdminCompetition } from '@/types'
import { formatDateTime, formatRelative } from '@/utils/format'

interface ProposalCardProps {
  item: AdminCompetition & { submittedBy: NonNullable<AdminCompetition['submittedBy']> }
  /** Đang lưu hoặc đang duyệt / từ chối: khoá nút */
  busy?: boolean
  onApprove(): void
  onReject(): void
}

/** Khung đầu cột bên ở trang sửa cuộc thi do người dùng đề xuất: người gửi, nguồn kiểm chứng, duyệt / từ chối */
export function CompetitionProposalCard({ item, busy, onApprove, onReject }: ProposalCardProps) {
  const { submittedBy: by } = item
  const reviewer = (verb: string) => (
    <>
      {verb}
      {item.reviewedByName && (
        <>
          {' '}
          bởi <b className="ink">{item.reviewedByName}</b>
        </>
      )}
      {item.reviewedAt && <> lúc {formatDateTime(item.reviewedAt)}</>}
    </>
  )

  const details: KeyValueItem[] = [
    ...(item.status === 'rejected' && item.reviewNote ? [{ label: 'Lý do từ chối', value: <span className="proposal-note">{item.reviewNote}</span> }] : []),
    {
      label: 'Người gửi',
      value: (
        <>
          {by.fullName}
          <div>
            <a href={`mailto:${by.email}`} className="mo">
              {by.email}
            </a>
          </div>
        </>
      ),
    },
    { label: 'Vai trò', value: item.submitterIsOrganizer ? 'Thành viên BTC' : 'Người dùng giới thiệu' },
    { label: 'Gửi lúc', value: `${formatDateTime(item.createdAt)} · ${formatRelative(item.createdAt)}` },
    {
      label: 'Nguồn để kiểm chứng',
      value: item.registerUrl ? (
        <a href={item.registerUrl} target="_blank" rel="noopener noreferrer">
          {item.registerUrl}
        </a>
      ) : (
        <span className="mo">Người gửi không để link</span>
      ),
    },
    ...(item.submitterNote ? [{ label: 'Lời nhắn của người gửi', value: <span className="proposal-note">{item.submitterNote}</span> }] : []),
  ]

  return (
    <Card icon={Inbox} title="Đề xuất từ người dùng">
      {item.status === 'pending' ? (
        <InfoBox>Kiểm tra nguồn và sửa thông tin nếu cần. Cuộc thi chỉ hiện trên web sau khi duyệt.</InfoBox>
      ) : item.status === 'rejected' ? (
        <div className="grade-status">
          <span className="text-red">
            <Icon icon={CircleX} />
          </span>
          <span>{reviewer('Đã từ chối')}</span>
        </div>
      ) : item.reviewedAt ? (
        <div className="grade-status">
          <span className="check-on">
            <Icon icon={Check} />
          </span>
          <span>{reviewer('Đã duyệt')}</span>
        </div>
      ) : null}

      <KeyValueGrid columns={1} items={details} />

      {item.status === 'pending' ? (
        <div className="grade-actions">
          <Button variant="danger-outline" icon={CircleX} disabled={busy} onClick={onReject}>
            Từ chối
          </Button>
          <Button variant="primary" icon={BadgeCheck} disabled={busy} onClick={onApprove}>
            Duyệt & đăng
          </Button>
        </div>
      ) : item.status === 'rejected' ? (
        <div className="publish-actions mt16">
          <Button variant="primary" icon={BadgeCheck} disabled={busy} onClick={onApprove}>
            Duyệt & đăng
          </Button>
          <div className="field-hint">Người gửi có thể sửa và gửi lại; khi đó đề xuất về Chờ duyệt.</div>
        </div>
      ) : null}
    </Card>
  )
}
