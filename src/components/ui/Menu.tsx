import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Icon, type IconType } from './Icon'

interface DropdownMenuProps {
  /** Nút mở menu. Nhận trạng thái và hàm bật/tắt. */
  trigger(props: { open: boolean; toggle(): void }): ReactNode
  children: ReactNode
  label?: string
  /** Canh mép menu theo nút: phải (mặc định) hoặc trái */
  align?: 'end' | 'start'
}

/**
 * Menu thả xuống. Vẽ vào body (position: fixed) để không bị cắt trong bảng cuộn ngang;
 * tự lật lên trên khi sát đáy màn hình.
 */
export function DropdownMenu({ trigger, children, label, align = 'end' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const menu = menuRef.current
    const anchor = anchorRef.current
    if (!open || !menu || !anchor) return
    const place = () => {
      const r = anchor.getBoundingClientRect()
      const h = menu.offsetHeight
      const below = r.bottom + 8 + h <= window.innerHeight - 8
      menu.style.top = `${below ? r.bottom + 8 : Math.max(8, r.top - 8 - h)}px`
      if (align === 'end') {
        menu.style.right = `${Math.max(8, window.innerWidth - r.right)}px`
        menu.style.left = 'auto'
      } else {
        menu.style.left = `${Math.max(8, r.left)}px`
        menu.style.right = 'auto'
      }
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!anchorRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu-anchor" ref={anchorRef} onClick={(e) => e.stopPropagation()}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open &&
        createPortal(
          <div ref={menuRef} className="menu" role="menu" aria-label={label} onClick={() => setOpen(false)}>
            {children}
          </div>,
          document.body,
        )}
    </div>
  )
}

export function MenuHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="menu-head">
      <b>{title}</b>
      {subtitle && <span>{subtitle}</span>}
    </div>
  )
}

export function MenuDivider() {
  return <div className="menu-divider" role="separator" />
}

interface MenuItemProps {
  icon?: IconType
  children: ReactNode
  onSelect?(): void
  disabled?: boolean
  danger?: boolean
  /** Lý do bị khoá, hiện dưới nhãn */
  hint?: string
}

export function MenuItem({ icon, children, onSelect, disabled, danger, hint }: MenuItemProps) {
  return (
    <button
      type="button"
      className={clsx('menu-item', danger && 'danger', hint && 'with-hint')}
      role="menuitem"
      onClick={(e) => {
        if (disabled) {
          e.stopPropagation()
          return
        }
        onSelect?.()
      }}
      aria-disabled={disabled || undefined}
      title={disabled ? hint : undefined}
    >
      {icon && <Icon icon={icon} />}
      <span>
        {children}
        {disabled && hint && <small>{hint}</small>}
      </span>
    </button>
  )
}
