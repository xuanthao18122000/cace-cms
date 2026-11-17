import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatNumber } from '@/utils/format'
import { IconButton } from './Button'
import { Select } from './Select'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange(page: number): void
  onPageSizeChange?(size: number): void
  pageSizes?: number[]
}

function pageList(page: number, last: number): (number | 'gap')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = [...new Set([1, last, page - 1, page, page + 1])].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('gap')
    out.push(p)
  })
  return out
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [10, 20, 50] }: PaginationProps) {
  const last = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <nav className="pagination" aria-label="Phân trang">
      <span>
        {formatNumber(from)}–{formatNumber(to)} trong {formatNumber(total)}
      </span>
      <div className="pagination-pages">
        <IconButton icon={ChevronLeft} label="Trang trước" plain disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
        {pageList(page, last).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={clsx('page-btn', p === page && 'active')}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <IconButton icon={ChevronRight} label="Trang sau" plain disabled={page >= last} onClick={() => onPageChange(page + 1)} />
      </div>
      {onPageSizeChange && (
        <div className="pagination-size">
          <span aria-hidden="true">Mỗi trang</span>
          <Select
            aria-label="Số dòng mỗi trang"
            value={String(pageSize)}
            options={pageSizes.map((s) => ({ value: String(s), label: String(s) }))}
            searchable={false}
            onChange={(v) => onPageSizeChange(Number(v))}
          />
        </div>
      )}
    </nav>
  )
}
