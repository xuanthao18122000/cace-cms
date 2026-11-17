import { useNavigate } from 'react-router-dom'
import { BadgeCheck, CircleX, Ellipsis, EyeOff, Pencil, Send, Star, StarOff, Trash2 } from 'lucide-react'
import { DropdownMenu, IconButton, MenuDivider, MenuItem } from '@/components/ui'
import type { AdminCompetition } from '@/types'
import { isReviewStatus } from './competitionLabels'
import type { CompetitionActions } from './useCompetitionActions'

export function CompetitionRowMenu({ item, actions }: { item: AdminCompetition; actions: CompetitionActions }) {
  const navigate = useNavigate()
  const published = item.status === 'published'
  // Đề xuất chờ duyệt / đã từ chối: chỉ đổi trạng thái qua duyệt, từ chối
  const inReview = isReviewStatus(item.status)
  return (
    <DropdownMenu
      label={`Thao tác với ${item.name}`}
      trigger={({ open, toggle }) => <IconButton icon={Ellipsis} label="Thao tác" plain aria-haspopup="menu" aria-expanded={open} onClick={toggle} />}
    >
      <MenuItem icon={Pencil} onSelect={() => navigate(`/competitions/${item.id}`)}>
        {inReview ? 'Xem & sửa' : 'Sửa'}
      </MenuItem>
      {inReview && item.submittedBy && (
        <MenuItem icon={BadgeCheck} onSelect={() => actions.askApprove(item)}>
          Duyệt & đăng
        </MenuItem>
      )}
      {item.status === 'pending' && (
        <MenuItem icon={CircleX} onSelect={() => actions.askReject(item)}>
          Từ chối…
        </MenuItem>
      )}
      {!inReview && (
        <MenuItem icon={published ? EyeOff : Send} onSelect={() => actions.togglePublish(item)}>
          {published ? 'Ẩn' : 'Xuất bản'}
        </MenuItem>
      )}
      <MenuItem icon={item.isFeatured ? StarOff : Star} onSelect={() => actions.toggleFeatured(item)}>
        {item.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
      </MenuItem>
      <MenuDivider />
      <MenuItem icon={Trash2} danger onSelect={() => actions.askDelete(item)}>
        Xoá
      </MenuItem>
    </DropdownMenu>
  )
}
