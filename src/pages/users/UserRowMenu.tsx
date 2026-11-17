import { Ellipsis, KeyRound, Lock, LockOpen, Pencil, Trash2 } from 'lucide-react'
import { DropdownMenu, IconButton, MenuDivider, MenuItem } from '@/components/ui'
import type { User } from '@/types'
import type { UserActions } from './useUserActions'

const SELF_HINT = 'Không thể thao tác trên tài khoản của chính bạn'

export function UserRowMenu({ user, isSelf, actions }: { user: User; isSelf: boolean; actions: UserActions }) {
  const locked = user.status === 'locked'
  return (
    <DropdownMenu
      label={`Thao tác với ${user.fullName}`}
      trigger={({ open, toggle }) => (
        <IconButton icon={Ellipsis} label="Thao tác" plain aria-haspopup="menu" aria-expanded={open} onClick={toggle} />
      )}
    >
      <MenuItem icon={Pencil} onSelect={() => actions.openEdit(user)}>
        Sửa
      </MenuItem>
      <MenuItem icon={KeyRound} onSelect={() => actions.openReset(user)}>
        Đặt lại mật khẩu
      </MenuItem>
      <MenuItem icon={locked ? LockOpen : Lock} disabled={isSelf} hint={SELF_HINT} onSelect={() => actions.toggleLock(user)}>
        {locked ? 'Mở khoá' : 'Khoá tài khoản'}
      </MenuItem>
      <MenuDivider />
      <MenuItem icon={Trash2} danger disabled={isSelf} hint={SELF_HINT} onSelect={() => actions.askDelete(user)}>
        Xoá
      </MenuItem>
    </DropdownMenu>
  )
}
