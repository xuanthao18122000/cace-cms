import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useDismiss } from '@/hooks/useDismiss'
import { normalizeText } from '@/utils/text'
import { Icon } from './Icon'

export interface SelectOption {
  value: string
  label: string
  /** Dòng phụ xám dưới nhãn */
  description?: string
  /** Nội dung đứng trước nhãn, vd chấm màu */
  prefix?: ReactNode
  disabled?: boolean
}

interface SelectProps {
  value: string
  onChange(value: string): void
  options: SelectOption[]
  placeholder?: string
  /**
   * field: ô chọn trong form.
   * chip: nút tròn trong thanh lọc; value rỗng = "tất cả", có giá trị thì tô màu thương hiệu.
   */
  variant?: 'field' | 'chip'
  /** Hiện ô tìm khi có từ 7 lựa chọn (mặc định) */
  searchable?: boolean
  id?: string
  invalid?: boolean
  disabled?: boolean
  'aria-label'?: string
}

/** Ô chọn có tìm kiếm (gõ không dấu vẫn ra), điều khiển được bằng phím */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Chọn',
  variant = 'field',
  searchable,
  id,
  invalid,
  disabled,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const allOptions = useMemo(
    () => (variant === 'chip' ? [{ value: '', label: placeholder }, ...options] : options),
    [variant, placeholder, options],
  )
  const showSearch = searchable ?? allOptions.length >= 7
  const filtered = useMemo(() => {
    const q = normalizeText(query)
    return q ? allOptions.filter((o) => normalizeText(`${o.label} ${o.description ?? ''}`).includes(q)) : allOptions
  }, [allOptions, query])

  const selected = options.find((o) => o.value === value)

  const close = () => {
    setOpen(false)
    setQuery('')
  }
  useDismiss(rootRef, open, close)

  const openPanel = () => {
    if (disabled) return
    setOpen(true)
    setActive(Math.max(0, allOptions.findIndex((o) => o.value === value)))
  }

  const choose = (opt: SelectOption) => {
    if (opt.disabled) return
    onChange(opt.value)
    close()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openPanel()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[active]) choose(filtered[active])
    } else if (e.key === 'Tab') {
      close()
    } else if (e.key === 'Escape') {
      // Chỉ đóng danh sách: chặn không cho Esc nổi lên document đóng luôn Drawer / Dialog chứa Select
      e.stopPropagation()
      close()
    }
  }

  return (
    <div
      ref={rootRef}
      className={clsx('select', variant === 'chip' && 'chip', variant === 'chip' && value && 'has-value', open && 'open')}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        id={id}
        className={clsx('select-trigger', variant === 'field' && 'input', invalid && 'invalid')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openPanel())}
      >
        <span className="select-value">
          {selected ? (
            <>
              {selected.prefix}
              {selected.prefix && ' '}
              {selected.label}
            </>
          ) : (
            <span className="select-placeholder">{placeholder}</span>
          )}
        </span>
        <Icon icon={ChevronDown} />
      </button>

      {open && (
        <div className="select-panel">
          {showSearch && (
            <div className="select-search">
              <Icon icon={Search} />
              <input
                autoFocus
                placeholder="Gõ để tìm"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                aria-label="Tìm trong danh sách"
              />
            </div>
          )}
          <div className="select-list" role="listbox" id={listId} tabIndex={showSearch ? undefined : -1}>
            {filtered.length === 0 && <div className="select-option empty-option">Không có kết quả</div>}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value
              return (
                <div
                  key={opt.value || '__all'}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  className={clsx('select-option', isSelected && 'selected', i === active && 'active')}
                  style={opt.disabled ? { opacity: 0.5, cursor: 'default' } : undefined}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(opt)}
                >
                  {opt.prefix}
                  <div>
                    {opt.label}
                    {opt.description && <small>{opt.description}</small>}
                  </div>
                  {isSelected && <Icon icon={Check} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
