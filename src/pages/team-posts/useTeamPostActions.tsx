import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorMessage, teamPostApi } from '@/api'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { AdminTeamPost, TeamPostStatus } from '@/types'
import { STATUS_LABEL, teamPostWebUrl } from './teamPostLabels'

type TeamPostRef = Pick<AdminTeamPost, 'id' | 'title' | 'status'>

export interface TeamPostActions {
  openOnWeb(item: TeamPostRef): void
  askHide(item: TeamPostRef): void
  unhide(item: TeamPostRef): void
  close(item: TeamPostRef): void
}

/** Kiểm duyệt tin tìm đồng đội: ẩn (có xác nhận), hiện lại, đóng */
export function useTeamPostActions() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [hiding, setHiding] = useState<TeamPostRef | null>(null)

  const patch = useMutation({
    mutationFn: ({ item, status }: { item: TeamPostRef; status: TeamPostStatus; message: (saved: TeamPostStatus) => string }) =>
      teamPostApi.setStatus(item.id, status),
    // Báo theo trạng thái máy chủ trả về: hiện lại tin đã đủ người / cuộc thi hết hạn thì máy chủ để ở "Đã đóng"
    onSuccess: (saved, { message }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teamPosts })
      setHiding(null)
      toast.success(message(saved.status))
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const actions: TeamPostActions = {
    openOnWeb: (p) => window.open(teamPostWebUrl(p.id), '_blank', 'noopener,noreferrer'),
    askHide: (p) => setHiding(p),
    unhide: (p) =>
      patch.mutate({
        item: p,
        status: 'open',
        message: (saved) =>
          saved === 'open'
            ? `Đã hiện lại tin ${p.title}`
            : `Đã hiện lại tin ${p.title} ở trạng thái ${STATUS_LABEL[saved]} (đội đã đủ người hoặc cuộc thi đã hết hạn)`,
      }),
    close: (p) => patch.mutate({ item: p, status: 'closed', message: () => `Đã đóng tin ${p.title}` }),
  }

  const dialogs = (
    <ConfirmDialog
      open={hiding !== null}
      title="Ẩn tin tìm đồng đội?"
      message={
        <>
          Tin <b>{hiding?.title}</b> sẽ biến mất khỏi web; chủ tin vẫn thấy trong mục của họ.
        </>
      }
      confirmLabel="Ẩn tin"
      danger
      busy={patch.isPending}
      onClose={() => setHiding(null)}
      onConfirm={() => hiding && patch.mutate({ item: hiding, status: 'hidden', message: () => `Đã ẩn tin ${hiding.title} khỏi web` })}
    />
  )

  return { actions, dialogs, pending: patch.isPending }
}
