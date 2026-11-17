import { useNavigate } from 'react-router-dom'
import { Ellipsis, EyeOff, ExternalLink, Pencil, Send, Star, StarOff, Trash2 } from 'lucide-react'
import { DropdownMenu, IconButton, MenuDivider, MenuItem } from '@/components/ui'
import type { AdminCaseItem } from '@/types'
import type { CaseActions } from './useCaseActions'

export function CaseRowMenu({ item, actions }: { item: AdminCaseItem; actions: CaseActions }) {
  const navigate = useNavigate()
  const published = item.status === 'published'
  return (
    <DropdownMenu
      label={`Thao tác với ${item.title}`}
      trigger={({ open, toggle }) => <IconButton icon={Ellipsis} label="Thao tác" plain aria-haspopup="menu" aria-expanded={open} onClick={toggle} />}
    >
      <MenuItem icon={Pencil} onSelect={() => navigate(`/cases/${item.id}`)}>
        Sửa
      </MenuItem>
      {published && (
        <MenuItem icon={ExternalLink} onSelect={() => actions.openOnWeb(item)}>
          Xem trên web
        </MenuItem>
      )}
      <MenuItem icon={published ? EyeOff : Send} onSelect={() => actions.togglePublish(item)}>
        {published ? 'Ẩn' : 'Xuất bản'}
      </MenuItem>
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
