import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorMessage, userApi } from '@/api'
import { ConfirmDialog } from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { User } from '@/types'
import { ResetPasswordDialog } from './ResetPasswordDialog'
import { UserFormDrawer } from './UserFormDrawer'

export interface UserActions {
  openCreate(): void
  openEdit(user: User): void
  openReset(user: User): void
  toggleLock(user: User): void
  askDelete(user: User): void
}

/** Gom drawer thêm/sửa, hộp thoại đặt lại mật khẩu, khoá, xoá: dùng chung cho danh sách và trang chi tiết */
interface Options {
  /** Mở sẵn drawer thêm mới (lối tắt /users?new=1) */
  initialCreate?: boolean
  onDeleted?(user: User): void
  onCreated?(user: User): void
}

export function useUserActions({ initialCreate, onDeleted, onCreated }: Options = {}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user: me, setUser } = useAuth()
  // undefined: đóng; null: thêm mới
  const [editing, setEditing] = useState<User | null | undefined>(initialCreate ? null : undefined)
  const [resetting, setResetting] = useState<User | null>(null)
  const [locking, setLocking] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)

  const afterChange = (saved?: User) => {
    if (saved) {
      queryClient.setQueryData(queryKeys.user(saved.id), saved)
      if (saved.id === me?.id) setUser(saved)
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.users })
    queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    queryClient.invalidateQueries({ queryKey: queryKeys.roles })
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: User['status'] }) => userApi.update(id, { status }),
    onSuccess: (saved) => {
      afterChange(saved)
      setLocking(null)
      toast.success(saved.status === 'locked' ? `Đã khoá tài khoản ${saved.fullName}` : `Đã mở khoá ${saved.fullName}`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (u: User) => userApi.remove(u.id),
    onSuccess: (_, u) => {
      queryClient.removeQueries({ queryKey: queryKeys.user(u.id) })
      afterChange()
      setDeleting(null)
      toast.success(`Đã xoá ${u.fullName}`)
      onDeleted?.(u)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const actions: UserActions = {
    openCreate: () => setEditing(null),
    openEdit: (u) => setEditing(u),
    openReset: (u) => setResetting(u),
    toggleLock: (u) => {
      if (u.status === 'locked') statusMutation.mutate({ id: u.id, status: 'active' })
      else setLocking(u)
    },
    askDelete: (u) => setDeleting(u),
  }

  const dialogs = (
    <>
      <UserFormDrawer
        open={editing !== undefined}
        user={editing ?? null}
        isSelf={Boolean(editing && editing.id === me?.id)}
        onClose={() => setEditing(undefined)}
        onSaved={(saved, created) => {
          afterChange(saved)
          setEditing(undefined)
          if (created) onCreated?.(saved)
        }}
      />
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
      <ConfirmDialog
        open={locking !== null}
        title="Khoá tài khoản?"
        message={
          <>
            <b>{locking?.fullName}</b> sẽ bị đăng xuất và không thể đăng nhập cho tới khi được mở khoá.
          </>
        }
        confirmLabel="Khoá tài khoản"
        danger
        busy={statusMutation.isPending}
        onClose={() => setLocking(null)}
        onConfirm={() => locking && statusMutation.mutate({ id: locking.id, status: 'locked' })}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Xoá người dùng?"
        message={
          <>
            Xoá vĩnh viễn tài khoản <b>{deleting?.fullName}</b> ({deleting?.email}). Thao tác này không hoàn tác được.
          </>
        }
        confirmLabel="Xoá người dùng"
        danger
        busy={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </>
  )

  return { actions, dialogs, statusPending: statusMutation.isPending }
}
