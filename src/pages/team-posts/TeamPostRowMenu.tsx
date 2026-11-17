import { Ellipsis, Eye, EyeOff, ExternalLink, Lock } from 'lucide-react'
import { DropdownMenu, IconButton, MenuDivider, MenuItem } from '@/components/ui'
import type { AdminTeamPost } from '@/types'
import type { TeamPostActions } from './useTeamPostActions'

export function TeamPostRowMenu({ item, actions }: { item: AdminTeamPost; actions: TeamPostActions }) {
  return (
    <DropdownMenu
      label={`Thao tác với ${item.title}`}
      trigger={({ open, toggle }) => <IconButton icon={Ellipsis} label="Thao tác" plain aria-haspopup="menu" aria-expanded={open} onClick={toggle} />}
    >
      {/* Tin đã ẩn không còn trên web */}
      <MenuItem icon={ExternalLink} disabled={item.status === 'hidden'} onSelect={() => actions.openOnWeb(item)}>
        Xem trên web
      </MenuItem>
      {item.status === 'open' && (
        <MenuItem icon={Lock} onSelect={() => actions.close(item)}>
          Đóng tin
        </MenuItem>
      )}
      {item.status === 'hidden' ? (
        <>
          <MenuDivider />
          <MenuItem icon={Eye} onSelect={() => actions.unhide(item)}>
            Hiện lại
          </MenuItem>
        </>
      ) : (
        <>
          <MenuDivider />
          <MenuItem icon={EyeOff} danger onSelect={() => actions.askHide(item)}>
            Ẩn tin
          </MenuItem>
        </>
      )}
    </DropdownMenu>
  )
}
