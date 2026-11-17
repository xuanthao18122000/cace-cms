import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { competitionApi, errorMessage } from '@/api'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { AdminCompetition, CompetitionInput } from '@/types'
import { RejectCompetitionDialog } from './RejectCompetitionDialog'

type CompetitionRef = Pick<AdminCompetition, 'id' | 'name' | 'status' | 'isFeatured'>

interface ApproveOptions {
  /** Chạy trước khi duyệt (vd lưu thay đổi đang sửa); trả false thì dừng, không duyệt */
  prepare?(): Promise<boolean>
  /** Có thay đổi chưa lưu: báo trong hộp xác nhận rằng sẽ lưu trước */
  unsaved?: boolean
}

export interface CompetitionActions {
  togglePublish(item: CompetitionRef): void
  toggleFeatured(item: CompetitionRef): void
  askDelete(item: CompetitionRef): void
  askApprove(item: CompetitionRef, options?: ApproveOptions): void
  askReject(item: CompetitionRef): void
}

/** Huỷ duyệt vì bước chuẩn bị không qua (form lỗi, lưu lỗi): đã báo lỗi ở bước đó */
class PrepareCancelled extends Error {}

/** Xuất bản / ẩn, nổi bật, xoá, duyệt / từ chối đề xuất: dùng chung cho danh sách và trang sửa cuộc thi */
export function useCompetitionActions({
  onDeleted,
  onReviewed,
}: { onDeleted?(item: CompetitionRef): void; onReviewed?(saved: AdminCompetition): void } = {}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<CompetitionRef | null>(null)
  const [approving, setApproving] = useState<{ item: CompetitionRef; options: ApproveOptions } | null>(null)
  const [rejecting, setRejecting] = useState<CompetitionRef | null>(null)

  const applySaved = (saved: AdminCompetition) => {
    queryClient.setQueryData(queryKeys.competition(saved.id), saved)
    queryClient.invalidateQueries({ queryKey: queryKeys.competitions })
  }

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CompetitionInput>; message: string }) => competitionApi.update(id, body),
    onSuccess: (saved, { message }) => {
      applySaved(saved)
      toast.success(message)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (item: CompetitionRef) => competitionApi.remove(item.id),
    onSuccess: (_, item) => {
      queryClient.removeQueries({ queryKey: queryKeys.competition(item.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions })
      setDeleting(null)
      toast.success(`Đã xoá cuộc thi ${item.name}`)
      onDeleted?.(item)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const approve = useMutation({
    mutationFn: async ({ item, options }: { item: CompetitionRef; options: ApproveOptions }) => {
      if (options.prepare && !(await options.prepare())) throw new PrepareCancelled()
      return competitionApi.approve(item.id)
    },
    onSuccess: (saved) => {
      applySaved(saved)
      setApproving(null)
      toast.success(`Đã duyệt và đăng ${saved.name}`)
      onReviewed?.(saved)
    },
    onError: (err) => {
      setApproving(null)
      if (!(err instanceof PrepareCancelled)) toast.error(errorMessage(err))
    },
  })

  const reject = useMutation({
    mutationFn: ({ item, reason }: { item: CompetitionRef; reason: string }) => competitionApi.reject(item.id, reason),
    onSuccess: (saved) => {
      applySaved(saved)
      setRejecting(null)
      toast.success(`Đã từ chối ${saved.name}`)
      onReviewed?.(saved)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const actions: CompetitionActions = {
    togglePublish: (c) => {
      const publish = c.status !== 'published'
      patch.mutate({ id: c.id, body: { status: publish ? 'published' : 'hidden' }, message: publish ? `Đã xuất bản ${c.name}` : `Đã ẩn ${c.name} khỏi web` })
    },
    toggleFeatured: (c) =>
      patch.mutate({ id: c.id, body: { isFeatured: !c.isFeatured }, message: c.isFeatured ? `Đã bỏ nổi bật ${c.name}` : `Đã đánh dấu nổi bật ${c.name}` }),
    askDelete: (c) => setDeleting(c),
    askApprove: (c, options = {}) => setApproving({ item: c, options }),
    askReject: (c) => setRejecting(c),
  }

  const dialogs = (
    <>
      <ConfirmDialog
        open={deleting !== null}
        title="Xoá cuộc thi?"
        message={
          <>
            Xoá vĩnh viễn cuộc thi <b>{deleting?.name}</b>. Thao tác này không hoàn tác được.
          </>
        }
        confirmLabel="Xoá cuộc thi"
        danger
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
      <ConfirmDialog
        open={approving !== null}
        title="Duyệt và đăng cuộc thi?"
        message={
          <>
            Cuộc thi <b>{approving?.item.name}</b> sẽ hiện trên web và người gửi nhận email.
            {approving?.options.unsaved && ' Các thay đổi chưa lưu sẽ được lưu trước khi duyệt.'}
          </>
        }
        confirmLabel={approving?.options.unsaved ? 'Lưu, duyệt & đăng' : 'Duyệt & đăng'}
        busy={approve.isPending}
        onClose={() => setApproving(null)}
        onConfirm={() => approving && approve.mutate(approving)}
      />
      {rejecting && (
        <RejectCompetitionDialog
          name={rejecting.name}
          busy={reject.isPending}
          onClose={() => setRejecting(null)}
          onSubmit={(reason) => reject.mutate({ item: rejecting, reason })}
        />
      )}
    </>
  )

  return { actions, dialogs, pending: patch.isPending, reviewing: approve.isPending || reject.isPending }
}
