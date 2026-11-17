import { useState, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { initials } from '@/utils/format'
import { Icon, type IconType } from './Icon'
import type { Tone } from './tone'

/* ---------- Badge ---------- */

interface BadgeProps {
  tone?: Tone
  /** Ẩn chấm tròn đầu badge */
  noDot?: boolean
  icon?: IconType
  children: ReactNode
  className?: string
  title?: string
}

export function Badge({ tone = 'gray', noDot, icon, children, className, title }: BadgeProps) {
  return (
    <span className={clsx('badge', `tone-${tone}`, (noDot || icon) && 'no-dot', className)} title={title}>
      {icon && <Icon icon={icon} />}
      {children}
    </span>
  )
}

export function CountPill({ value, muted }: { value: number | string; muted?: boolean }) {
  return <span className={clsx('count-pill', muted && 'muted')}>{value}</span>
}

/* ---------- Ô icon màu ---------- */

export function IconTile({ icon, tone = 'brand', size = 'md' }: { icon: IconType; tone?: Tone; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={clsx('icon-tile', `tone-${tone}`, size !== 'md' && size)}>
      <Icon icon={icon} />
    </span>
  )
}

/* ---------- Avatar: ảnh hoặc chữ cái đầu ---------- */

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  // Ảnh lỗi (bị xoá, sai đường dẫn) thì quay về chữ cái đầu
  const [failed, setFailed] = useState<string | null>(null)
  const showImg = src && failed !== src
  return (
    <span className={clsx('avatar', size !== 'md' && size)} aria-hidden="true">
      {showImg ? <img src={src} alt="" onError={() => setFailed(src)} /> : initials(name)}
    </span>
  )
}

/* ---------- Ô thực thể: avatar/icon + tên + dòng phụ ---------- */

interface EntityCellProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: IconType
  avatarName?: string
  avatarSrc?: string | null
  compact?: boolean
}

export function EntityCell({ title, subtitle, icon, avatarName, avatarSrc, compact }: EntityCellProps) {
  return (
    <div className={clsx('entity', compact && 'compact')}>
      {avatarName !== undefined ? (
        <Avatar name={avatarName} src={avatarSrc} />
      ) : (
        icon && (
          <span className="entity-icon" aria-hidden="true">
            <Icon icon={icon} />
          </span>
        )
      )}
      <div className="min-w-0">
        <div className="entity-title">{title}</div>
        {subtitle && <div className="entity-sub">{subtitle}</div>}
      </div>
    </div>
  )
}

/* ---------- Bảng key-value ---------- */

export interface KeyValueItem {
  label: string
  value: ReactNode
  state?: 'warn' | 'bad' | 'good'
}

export function KeyValueGrid({ items, columns = 3 }: { items: KeyValueItem[]; columns?: 1 | 2 | 3 }) {
  return (
    <div className={clsx('kv', columns !== 3 && `cols-${columns}`)}>
      {items.map((item) => (
        <div key={item.label} className="kv-item">
          <div className="kv-label">{item.label}</div>
          <div className={clsx('kv-value', item.state)}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Thanh tỉ lệ ---------- */

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('progress', `bar-${tone}`)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ---------- Dòng lối tắt ---------- */

interface ActionRowProps {
  icon: IconType
  tone?: Tone
  title: ReactNode
  subtitle?: ReactNode
  onClick?(): void
  disabled?: boolean
}

export function ActionRow({ icon, tone = 'brand', title, subtitle, onClick, disabled }: ActionRowProps) {
  return (
    <button type="button" className="action-row" onClick={onClick} disabled={disabled}>
      <IconTile icon={icon} tone={tone} />
      <div className="action-text">
        <div className="action-title">{title}</div>
        {subtitle && <div className="action-sub">{subtitle}</div>}
      </div>
      <Icon icon={ChevronRight} />
    </button>
  )
}

/* ---------- Khung chờ (skeleton) ---------- */

export function Skeleton({ width, height = 14, round, style }: { width?: number | string; height?: number | string; round?: boolean; style?: CSSProperties }) {
  return <span className={clsx('skeleton', round && 'round')} style={{ width, height, ...style }} aria-hidden="true" />
}

/* ---------- Tooltip chữ khi rê chuột ---------- */

export function Tooltip({ text, children, block }: { text?: string | null; children: ReactNode; block?: boolean }) {
  if (!text) return <>{children}</>
  return (
    <span className={clsx('tip', block && 'block')} data-tip={text}>
      {children}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="kbd">{children}</span>
}
