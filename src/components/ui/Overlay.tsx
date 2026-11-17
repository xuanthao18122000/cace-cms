import { useEffect, useId, useRef, type FormEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Check, TriangleAlert, X } from 'lucide-react'
import { lockScroll } from '@/utils/scrollLock'
import { Button, IconButton } from './Button'
import { Icon } from './Icon'

/** Khoá cuộn trang, đóng bằng Esc, focus ô đầu tiên khi mở, trả focus khi đóng */
function useOverlay(open: boolean, onClose: () => void, busy: boolean, panelRef: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose)
  const busyRef = useRef(busy)
  useEffect(() => {
    closeRef.current = onClose
    busyRef.current = busy
  })

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const unlock = lockScroll()
    const first = panelRef.current?.querySelector<HTMLElement>(
      '[data-autofocus], input:not([type=hidden]):not([disabled]):not([type=file]), textarea, .btn-primary, .btn-danger',
    )
    first?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlock()
      prevFocus?.focus?.()
    }
  }, [open, panelRef])
}

/* ---------- Drawer: form trượt từ phải ---------- */

interface DrawerProps {
  open: boolean
  title: string
  subtitle?: ReactNode
  onClose(): void
  children: ReactNode
  /** Nút ở chân drawer. Bỏ trống nếu dùng onSubmit + submitLabel. */
  footer?: ReactNode
  /** Gắn form: Enter để lưu, chân drawer tự có nút Huỷ / Lưu */
  onSubmit?(): void
  submitLabel?: string
  footerLeft?: ReactNode
  busy?: boolean
  size?: 'md' | 'lg'
}

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  onSubmit,
  submitLabel = 'Lưu',
  footerLeft,
  busy = false,
  size = 'md',
}: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const formId = useId()
  useOverlay(open, onClose, busy, panelRef)
  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!busy) onSubmit?.()
  }

  return createPortal(
    <>
      <div className="overlay" onClick={() => !busy && onClose()} />
      <aside ref={panelRef} className={clsx('drawer', size === 'lg' && 'lg')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="drawer-head">
          <div className="min-w-0">
            <div className="drawer-title" id={titleId}>
              {title}
            </div>
            {subtitle && <div className="drawer-sub">{subtitle}</div>}
          </div>
          <IconButton icon={X} label="Đóng" onClick={onClose} disabled={busy} />
        </div>
        {onSubmit ? (
          <form id={formId} className="drawer-body" onSubmit={handleSubmit} noValidate autoComplete="off">
            {children}
          </form>
        ) : (
          <div className="drawer-body">{children}</div>
        )}
        {(footer || onSubmit) && (
          <div className="drawer-foot">
            {footerLeft && <span className="push-left">{footerLeft}</span>}
            {footer ?? (
              <>
                <Button onClick={onClose} disabled={busy}>
                  Huỷ
                </Button>
                <Button variant="primary" type="submit" form={formId} icon={Check} loading={busy}>
                  {submitLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </aside>
    </>,
    document.body,
  )
}

/* ---------- Hộp thoại có form ---------- */

interface DialogProps {
  open: boolean
  title: string
  description?: ReactNode
  onClose(): void
  onSubmit(): void
  submitLabel?: string
  danger?: boolean
  busy?: boolean
  children: ReactNode
}

export function Dialog({ open, title, description, onClose, onSubmit, submitLabel = 'Lưu', danger, busy = false, children }: DialogProps) {
  const panelRef = useRef<HTMLFormElement>(null)
  const titleId = useId()
  useOverlay(open, onClose, busy, panelRef)
  if (!open) return null

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form
        ref={panelRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        noValidate
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault()
          if (!busy) onSubmit()
        }}
      >
        <div className="dialog-title" id={titleId}>
          {title}
        </div>
        {description && <div className="dialog-text">{description}</div>}
        {children}
        <div className="dialog-actions">
          <Button onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} type="submit" loading={busy}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

/* ---------- Hộp thoại xác nhận ---------- */

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm(): void
  onClose(): void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Huỷ',
  danger,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useOverlay(open, onClose, busy, panelRef)
  if (!open) return null

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div ref={panelRef} className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        {danger && (
          <span className="dialog-icon tone-red">
            <Icon icon={TriangleAlert} />
          </span>
        )}
        <div className="dialog-title" id={titleId}>
          {title}
        </div>
        <div className="dialog-text">{message}</div>
        <div className="dialog-actions">
          <Button onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
