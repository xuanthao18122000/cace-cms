import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Search } from 'lucide-react'
import { Skeleton } from './Display'
import { Icon } from './Icon'
import { EmptyState } from './Layout'

export interface Column<T> {
  key: string
  header: ReactNode
  render(row: T): ReactNode
  /** Cột chính: trên điện thoại chiếm cả dòng đầu thẻ */
  main?: boolean
  /** Ẩn trên điện thoại */
  hideOnMobile?: boolean
  width?: number | string
  className?: string
  /** Dạng khung chờ của cột khi đang tải */
  skeleton?: 'entity' | 'badge' | 'text' | 'none'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey(row: NoInfer<T>): string
  onRowClick?(row: NoInfer<T>): void
  isRowDimmed?(row: NoInfer<T>): boolean
  /** Tải lần đầu: hiện khung chờ. Tải lại: làm mờ bảng hiện tại. */
  loading?: boolean
  skeletonRows?: number
  empty?: ReactNode
}

function SkeletonCell({ kind }: { kind: Column<unknown>['skeleton'] }) {
  if (kind === 'none') return null
  if (kind === 'entity')
    return (
      <div className="entity">
        <Skeleton width={38} height={38} round />
        <div className="stack-xs">
          <Skeleton width={140} />
          <Skeleton width={180} height={11} />
        </div>
      </div>
    )
  if (kind === 'badge') return <Skeleton width={78} height={22} style={{ borderRadius: 999 }} />
  return <Skeleton width={90} />
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  isRowDimmed,
  loading,
  skeletonRows = 6,
  empty = 'Không có dữ liệu',
}: DataTableProps<T>) {
  const initial = loading && rows.length === 0
  if (!loading && rows.length === 0) return <EmptyState>{empty}</EmptyState>

  return (
    <div className={clsx('table-wrap', loading && !initial && 'loading-overlay')} aria-busy={loading || undefined}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {initial
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={`sk-${i}`} className="skeleton-row">
                  {columns.map((col) => (
                    <td key={col.key} className={clsx(col.main && 'col-main', col.hideOnMobile && 'hide-mobile', col.className)}>
                      <SkeletonCell kind={col.skeleton ?? 'text'} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={clsx(onRowClick && 'clickable', isRowDimmed?.(row) && 'dimmed')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={clsx(col.main && 'col-main', col.hideOnMobile && 'hide-mobile', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

/** Cột thao tác cuối dòng: chặn click lan ra dòng */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <span className="row-actions" onClick={(e) => e.stopPropagation()}>
      {children}
    </span>
  )
}

/* ---------- Thanh lọc ---------- */

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filters">{children}</div>
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Tìm kiếm',
}: {
  value: string
  onChange(value: string): void
  placeholder?: string
}) {
  return (
    <label className="search-box">
      <Icon icon={Search} />
      <input type="search" placeholder={placeholder} aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function ResultCount({ children }: { children: ReactNode }) {
  return <span className="result-count">{children}</span>
}

/** Công tắc nhiều lựa chọn trong form, vd Hoạt động / Đã khoá */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: NoInfer<V>; label: string }[]
  value: V
  onChange(value: NoInfer<V>): void
  disabled?: boolean
}) {
  return (
    <div className={clsx('segmented', disabled && 'disabled')} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'active' : undefined}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
