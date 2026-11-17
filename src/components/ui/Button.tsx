import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { Icon, type IconType } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline' | 'danger-ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  icon?: IconType
  /** Icon bên phải chữ, vd mũi tên dropdown */
  iconRight?: ReactNode
  loading?: boolean
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  block,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spin sm" aria-hidden="true" /> : icon && <Icon icon={icon} />}
      {children !== undefined && <span>{children}</span>}
      {iconRight}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType
  /** Bắt buộc: đọc cho trình đọc màn hình và hiện tooltip */
  label: string
  danger?: boolean
  /** Không viền, không nền */
  plain?: boolean
}

export function IconButton({ icon, label, danger, plain, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={clsx('icon-btn', danger && 'danger', plain && 'plain', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon icon={icon} />
    </button>
  )
}

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconType
}

/** Nút dạng chữ màu thương hiệu, dùng trong dòng chữ */
export function LinkButton({ icon, className, children, type = 'button', ...rest }: LinkButtonProps) {
  return (
    <button type={type} className={clsx('link-btn', className)} {...rest}>
      {icon && <Icon icon={icon} />}
      {children}
    </button>
  )
}
