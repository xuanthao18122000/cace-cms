import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { ToastContext, type ToastApi, type ToastKind } from './toast'

interface Toast {
  id: number
  message: string
  kind: ToastKind
}

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

/** Một thông báo dạng viên thuốc ở giữa phía dưới; thông báo mới thay thông báo cũ */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const nextId = useRef(1)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId.current++
    setToast({ id, message, kind })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), kind === 'error' ? 5000 : 3000)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
    }),
    [show],
  )

  const KindIcon = toast ? ICONS[toast.kind] : null

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div role="status" aria-live="polite">
        {toast && KindIcon && (
          <div key={toast.id} className={`toast ${toast.kind}`}>
            <KindIcon className="i" aria-hidden="true" />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
