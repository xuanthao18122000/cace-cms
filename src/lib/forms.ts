import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { z } from 'zod'
import { ApiError, CODE_FIELDS } from '@/api'

/** Quy tắc mật khẩu chung với API: tối thiểu 8 ký tự, có cả chữ và số */
export const passwordSchema = z
  .string()
  .min(8, 'Tối thiểu 8 ký tự')
  .max(72, 'Tối đa 72 ký tự')
  .regex(/[A-Za-z]/, 'Cần ít nhất một chữ cái')
  .regex(/\d/, 'Cần ít nhất một chữ số')

export const emailSchema = z.string().trim().min(1, 'Nhập email').pipe(z.email('Email không hợp lệ'))

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[0-9 +().-]{8,20}$/.test(v), 'Số điện thoại không hợp lệ')

/**
 * Gắn lỗi máy chủ vào form: lỗi validate theo trường (details) và mã lỗi gắn với một trường (vd 409 email).
 * Trả về true nếu đã gắn được ít nhất một lỗi trường.
 */
export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  /** Đổi tên trường máy chủ → trường form, vd { password: 'newPassword' } */
  alias: Record<string, Path<T>> = {},
): boolean {
  if (!(err instanceof ApiError)) return false
  const known = new Set<string>(fields)
  let applied = false
  const put = (field: string, message: string) => {
    const name = (alias[field] ?? field) as Path<T>
    if (!known.has(name)) return
    setError(name, { type: 'server', message }, { shouldFocus: !applied })
    applied = true
  }
  for (const [field, message] of Object.entries(err.fieldErrors)) put(field, message)
  const codeField = CODE_FIELDS[err.code]
  if (codeField) put(codeField, err.message)
  return applied
}
