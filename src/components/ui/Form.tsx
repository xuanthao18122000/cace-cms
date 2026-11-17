import { useState, type ComponentProps, type ReactNode } from 'react'
import clsx from 'clsx'
import { CircleAlert, Eye, EyeOff, Info } from 'lucide-react'
import { IconButton } from './Button'
import { Icon } from './Icon'

/* ---------- Khung form ---------- */

/** Khối trắng gom nhóm trường trong drawer, vd "Thông tin chung" */
export function FormCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="form-card">
      {title && <div className="form-card-title">{title}</div>}
      {children}
    </div>
  )
}

/** Hai trường cạnh nhau, tự xuống một cột trên điện thoại */
export function FormRow({ children }: { children: ReactNode }) {
  return <div className="form-row">{children}</div>
}

interface FieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  error?: string
  children: ReactNode
}

export function Field({ label, htmlFor, required, hint, error, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        {label} {required && <i className="req">*</i>}
      </label>
      {children}
      {error ? (
        <div className="field-error" id={htmlFor ? `${htmlFor}-error` : undefined}>
          {error}
        </div>
      ) : (
        hint && <div className="field-hint">{hint}</div>
      )}
    </div>
  )
}

/* ---------- Ô nhập (React 19: ref là prop, dùng thẳng với register của react-hook-form) ---------- */

type InputProps = ComponentProps<'input'> & {
  invalid?: boolean
  suffix?: string
}

export function Input({ invalid, suffix, className, ...rest }: InputProps) {
  const input = (
    <input
      className={clsx('input', invalid && 'invalid', suffix && 'has-suffix', className)}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && rest.id ? `${rest.id}-error` : undefined}
      {...rest}
    />
  )
  if (!suffix) return input
  return (
    <span className="input-wrap">
      {input}
      <span className="input-suffix">{suffix}</span>
    </span>
  )
}

type TextareaProps = ComponentProps<'textarea'> & { invalid?: boolean }

export function Textarea({ invalid, className, rows = 3, ...rest }: TextareaProps) {
  return <textarea className={clsx('input', invalid && 'invalid', className)} aria-invalid={invalid || undefined} rows={rows} {...rest} />
}

/** Ô mật khẩu có nút ẩn/hiện */
export function PasswordInput(props: Omit<InputProps, 'type' | 'suffix'>) {
  const [show, setShow] = useState(false)
  return (
    <span className="input-wrap">
      <Input {...props} type={show ? 'text' : 'password'} style={{ paddingRight: 46 }} />
      <IconButton
        className="input-action"
        plain
        icon={show ? EyeOff : Eye}
        label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        onClick={() => setShow((s) => !s)}
      />
    </span>
  )
}

/** Ô tích có khung, dùng cho lựa chọn bật/tắt trong form */
export function OptionBox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange(checked: boolean): void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <label className={clsx('option-box', disabled && 'disabled')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {description && <small>{description}</small>}
      </span>
    </label>
  )
}

/* ---------- Hộp thông báo trong form ---------- */

export function ErrorBox({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <div className="error-box" role="alert">
      <Icon icon={CircleAlert} />
      <div>{children}</div>
    </div>
  )
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="info-box">
      <Icon icon={Info} />
      <div>{children}</div>
    </div>
  )
}

/* ---------- Công tắc bật/tắt ---------- */

interface SwitchProps {
  checked: boolean
  onChange(checked: boolean): void
  /** Chữ bên phải công tắc; bỏ trống thì phải có aria-label */
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

export function Switch({ checked, onChange, label, description, disabled, id, 'aria-label': ariaLabel }: SwitchProps) {
  const button = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={clsx('switch', checked && 'on')}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
    >
      <i aria-hidden="true" />
    </button>
  )
  if (!label) return button
  return (
    <label className={clsx('switch-row', disabled && 'disabled')}>
      {button}
      <span>
        {label}
        {description && <small>{description}</small>}
      </span>
    </label>
  )
}
