import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, caseApi, errorMessage } from '@/api'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { AdminCase, AdminCaseItem, CaseInput } from '@/types'
import { caseWebUrl } from './caseLabels'

type CaseRef = Pick<AdminCaseItem, 'id' | 'title' | 'slug' | 'status' | 'isFeatured'>

export interface CaseActions {
  togglePublish(item: CaseRef): void
  toggleFeatured(item: CaseRef): void
  openOnWeb(item: CaseRef): void
  askDelete(item: CaseRef): void
}

/** Xuất bản / ẩn, nổi bật, xoá: dùng chung cho danh sách và trang sửa case */
export function useCaseActions({ onDeleted }: { onDeleted?(item: CaseRef): void } = {}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<CaseRef | null>(null)

  const afterSave = (saved: AdminCase) => {
    queryClient.setQueryData(queryKeys.case(saved.id), saved)
    queryClient.invalidateQueries({ queryKey: queryKeys.cases })
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomies })
  }

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CaseInput>; message: string }) => caseApi.update(id, body),
    onSuccess: (saved, { message }) => {
      afterSave(saved)
      toast.success(message)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (item: CaseRef) => caseApi.remove(item.id),
    onSuccess: (_, item) => {
      queryClient.removeQueries({ queryKey: queryKeys.case(item.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.cases })
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomies })
      setDeleting(null)
      toast.success(`Đã xoá case ${item.title}`)
      onDeleted?.(item)
    },
    onError: (err) => {
      // Case đã có bài làm: không xoá được, đóng hộp thoại và gợi ý ẩn case
      if (err instanceof ApiError && err.code === 'CACE_CASE_HAS_SUBMISSIONS') setDeleting(null)
      toast.error(errorMessage(err))
    },
  })

  const actions: CaseActions = {
    togglePublish: (c) => {
      const publish = c.status !== 'published'
      patch.mutate({ id: c.id, body: { status: publish ? 'published' : 'hidden' }, message: publish ? `Đã xuất bản ${c.title}` : `Đã ẩn ${c.title} khỏi web` })
    },
    toggleFeatured: (c) =>
      patch.mutate({ id: c.id, body: { isFeatured: !c.isFeatured }, message: c.isFeatured ? `Đã bỏ nổi bật ${c.title}` : `Đã đánh dấu nổi bật ${c.title}` }),
    openOnWeb: (c) => window.open(caseWebUrl(c.slug), '_blank', 'noopener,noreferrer'),
    askDelete: (c) => setDeleting(c),
  }

  const dialogs = (
    <ConfirmDialog
      open={deleting !== null}
      title="Xoá case?"
      message={
        <>
          Xoá vĩnh viễn case <b>{deleting?.title}</b>. Thao tác này không hoàn tác được.
        </>
      }
      confirmLabel="Xoá case"
      danger
      busy={remove.isPending}
      onClose={() => setDeleting(null)}
      onConfirm={() => deleting && remove.mutate(deleting)}
    />
  )

  return { actions, dialogs, pending: patch.isPending }
}
