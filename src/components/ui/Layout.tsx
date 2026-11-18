import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, CircleAlert, Inbox, RotateCw } from 'lucide-react'
import { errorMessage } from '@/api'
import { Button } from './Button'
import { IconTile, Skeleton } from './Display'
import { Icon, type IconType } from './Icon'
import type { Tone } from './tone'

/* ---------- Đầu trang ---------- */

interface PageHeaderProps {
  crumbs?: { label: string; to?: string }[]
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ crumbs, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-head">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <div className="crumb">
            {crumbs.map((c, i) => (
              <span key={c.label}>
                {i > 0 && ' / '}
                {c.to ? <Link to={c.to}>{c.label}</Link> : c.label}
              </span>
            ))}
          </div>
        )}
        <h1>{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

/* ---------- Card ---------- */

interface CardProps {
  /** Icon nhỏ màu thương hiệu bên trái tiêu đề */
  icon?: IconType
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  highlight?: boolean
  className?: string
}

export function Card({ icon, title, subtitle, actions, children, highlight, className }: CardProps) {
  return (
    <div className={clsx('card', highlight && 'highlight', className)}>
      {(title || actions) && (
        <div className="card-head">
          <div className="min-w-0">
            {title && (
              <div className="card-title">
                {icon && (
                  <span className="card-title-icon" aria-hidden="true">
                    <Icon icon={icon} />
                  </span>
                )}
                {title}
              </div>
            )}
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

/** Card thu gọn được: bấm đầu card để mở/đóng. Đóng thì không vẽ nội dung. */
export function CollapsibleCard({
  icon,
  title,
  subtitle,
  defaultOpen = false,
  forceOpen,
  children,
}: {
  icon?: IconType
  title: ReactNode
  subtitle?: ReactNode
  defaultOpen?: boolean
  /** Luôn mở, vd khi bên trong có lỗi cần sửa */
  forceOpen?: boolean
  children: ReactNode
}) {
  const [state, setOpen] = useState(defaultOpen)
  const open = state || Boolean(forceOpen)
  return (
    <div className={clsx('card collapsible', open && 'open')}>
      <button type="button" className="card-head collapsible-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <div className="min-w-0">
          <div className="card-title">
            {icon && (
              <span className="card-title-icon" aria-hidden="true">
                <Icon icon={icon} />
              </span>
            )}
            {title}
          </div>
          {subtitle && <div className="card-sub">{subtitle}</div>}
        </div>
        <Icon icon={ChevronDown} className="collapsible-caret" />
      </button>
      {open && children}
    </div>
  )
}

/** Liên kết "Xem tất cả →" đặt ở góc phải đầu card */
export function CardLink({ to, children = 'Xem tất cả' }: { to: string; children?: ReactNode }) {
  return (
    <Link to={to} className="card-link">
      {children}
      <Icon icon={ArrowRight} />
    </Link>
  )
}

/* ---------- Thẻ số liệu ---------- */

interface StatCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon: IconType
  tone?: Tone
  loading?: boolean
}

export function StatCard({ label, value, sub, icon, tone = 'brand', loading }: StatCardProps) {
  return (
    <div className="stat">
      <div className="min-w-0">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{loading ? <Skeleton width={72} height={28} /> : value}</div>
        {sub && <div className="stat-sub">{loading ? <Skeleton width={110} height={12} /> : sub}</div>}
      </div>
      <IconTile icon={icon} tone={tone} />
    </div>
  )
}

/* ---------- Trạng thái rỗng, đang tải, lỗi ---------- */

export function Spinner({ small }: { small?: boolean }) {
  return <span className={clsx('spin', small && 'sm on-light')} aria-hidden="true" />
}

export function Loading({ label = 'Đang tải dữ liệu', full }: { label?: string; full?: boolean }) {
  return (
    <div className={clsx('loading', full && 'full')} role="status">
      <Spinner />
      {label}
    </div>
  )
}

/** Rỗng gọn trong card/bảng */
export function EmptyState({ icon = Inbox, children }: { icon?: IconType; children: ReactNode }) {
  return (
    <div className="empty">
      <Icon icon={icon} />
      {children}
    </div>
  )
}

/** Rỗng lớn: trang chưa có dữ liệu, có lời mời hành động */
export function EmptyHero({
  icon = Inbox,
  tone = 'brand',
  title,
  message,
  actions,
}: {
  icon?: IconType
  tone?: Tone
  title: string
  message?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="empty-lg">
      <IconTile icon={icon} tone={tone} size="lg" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

/** Lỗi tải dữ liệu, có nút thử lại */
export function ErrorState({ error, onRetry, title = 'Không tải được dữ liệu' }: { error: unknown; onRetry?(): void; title?: string }) {
  return (
    <EmptyHero
      icon={CircleAlert}
      tone="red"
      title={title}
      message={errorMessage(error)}
      actions={
        onRetry && (
          <Button icon={RotateCw} onClick={onRetry}>
            Thử lại
          </Button>
        )
      }
    />
  )
}
