import { useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDismiss } from '@/hooks/useDismiss'
import { Icon } from './Icon'
import { Select, type SelectOption } from './Select'

/** Giá trị giống ô datetime-local: "yyyy-MM-ddTHH:mm" (giờ máy) hoặc "" */
const VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm"
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const pad = (n: number) => String(n).padStart(2, '0')
const HOURS: SelectOption[] = Array.from({ length: 24 }, (_, h) => ({ value: pad(h), label: pad(h) }))

function parseValue(value: string) {
  if (!value) return null
  const d = parse(value.slice(0, 16), VALUE_FORMAT, new Date())
  return isValid(d) ? d : null
}

interface DateTimePickerProps {
  value: string
  onChange(value: string): void
  onBlur?(): void
  id?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  /** Hiện nút Xoá để bỏ trống */
  clearable?: boolean
  /** Giờ mặc định khi chọn ngày lúc chưa có giá trị, vd "23:59" cho hạn chót */
  defaultTime?: string
  'aria-label'?: string
}

/** Chọn ngày giờ dùng chung (thay ô datetime-local của trình duyệt) */
export function DateTimePicker({
  value,
  onChange,
  onBlur,
  id,
  placeholder = 'Chọn ngày giờ',
  invalid,
  disabled,
  clearable,
  defaultTime = '00:00',
  'aria-label': ariaLabel,
}: DateTimePickerProps) {
  const selected = parseValue(value)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()))
  const rootRef = useRef<HTMLDivElement>(null)

  const close = () => {
    if (!open) return
    setOpen(false)
    onBlur?.()
  }
  useDismiss(rootRef, open, close)

  const openPanel = () => {
    if (disabled) return
    setMonth(startOfMonth(selected ?? new Date()))
    setOpen(true)
  }

  const [defH, defM] = defaultTime.split(':')
  const hour = selected ? pad(selected.getHours()) : defH
  const minute = selected ? pad(selected.getMinutes()) : defM

  // Bước 5 phút, cộng thêm phút hiện tại nếu lệch bước (vd 23:59)
  const minuteSteps = Array.from({ length: 12 }, (_, i) => pad(i * 5))
  const minuteOptions: SelectOption[] = (minuteSteps.includes(minute) ? minuteSteps : [...minuteSteps, minute].sort()).map((m) => ({
    value: m,
    label: m,
  }))

  const emit = (day: Date, h: string, m: string) => onChange(`${format(day, 'yyyy-MM-dd')}T${h}:${m}`)

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  const today = new Date()

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      // Chỉ đóng lịch, không để Esc đóng luôn Drawer / Dialog bên ngoài
      e.stopPropagation()
      close()
    }
  }

  return (
    <div ref={rootRef} className={clsx('select', 'dtp', open && 'open')} onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        className={clsx('select-trigger', 'input', invalid && 'invalid')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openPanel())}
      >
        <Icon icon={CalendarDays} className="dtp-icon" />
        <span className="select-value">
          {selected ? (
            <>
              {format(selected, 'dd/MM/yyyy')} <span className="dtp-sep">·</span> {format(selected, 'HH:mm')}
            </>
          ) : (
            <span className="select-placeholder">{placeholder}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="select-panel dtp-panel" role="dialog" aria-label="Chọn ngày giờ">
          <div className="dtp-head">
            <button type="button" className="icon-btn plain" aria-label="Tháng trước" onClick={() => setMonth((m) => addMonths(m, -1))}>
              <Icon icon={ChevronLeft} />
            </button>
            <span className="dtp-month">{format(month, "'Tháng' M, yyyy", { locale: vi })}</span>
            <button type="button" className="icon-btn plain" aria-label="Tháng sau" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <Icon icon={ChevronRight} />
            </button>
          </div>

          <div className="dtp-grid" role="grid">
            {WEEKDAYS.map((w) => (
              <span key={w} className="dtp-weekday" role="columnheader">
                {w}
              </span>
            ))}
            {days.map((d) => {
              const isSel = selected && isSameDay(d, selected)
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  role="gridcell"
                  aria-selected={Boolean(isSel)}
                  aria-label={format(d, 'EEEE, dd/MM/yyyy', { locale: vi })}
                  className={clsx('dtp-day', !isSameMonth(d, month) && 'outside', isSameDay(d, today) && 'today', isSel && 'selected')}
                  onClick={() => emit(d, hour, minute)}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          <div className="dtp-time">
            <span className="dtp-time-label">Giờ</span>
            <Select
              aria-label="Giờ"
              value={hour}
              options={HOURS}
              searchable={false}
              disabled={!selected}
              onChange={(h) => selected && emit(selected, h, minute)}
            />
            <span className="dtp-colon">:</span>
            <Select
              aria-label="Phút"
              value={minute}
              options={minuteOptions}
              searchable={false}
              disabled={!selected}
              onChange={(m) => selected && emit(selected, hour, m)}
            />
          </div>

          <div className="dtp-foot">
            {clearable && selected ? (
              <button
                type="button"
                className="link-btn danger"
                onClick={() => {
                  onChange('')
                  close()
                }}
              >
                Xoá
              </button>
            ) : (
              <span />
            )}
            <div className="dtp-foot-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMonth(startOfMonth(today))
                  emit(today, hour, minute)
                }}
              >
                Hôm nay
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={close}>
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
