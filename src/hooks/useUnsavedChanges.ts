import { useEffect } from 'react'

/** Số trang / form đang có thay đổi chưa lưu */
let dirtyCount = 0
export const hasUnsavedChanges = () => dirtyCount > 0

/**
 * Đánh dấu đang có thay đổi chưa lưu: cảnh báo khi tải lại / đóng tab,
 * và khi phiên hết hạn thì giữ trang (hỏi đăng nhập lại) thay vì chuyển về /login.
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    dirtyCount++
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      dirtyCount--
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [dirty])
}
