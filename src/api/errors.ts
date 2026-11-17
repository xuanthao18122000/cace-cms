export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  status: number
  /** Mã lỗi máy chủ, vd CACE_EMAIL_TAKEN */
  code: string
  /** Lỗi theo từng trường của form, vd { email: 'Email đã được dùng' } */
  fieldErrors: FieldErrors
  details: unknown

  constructor(message: string, status = 400, fieldErrors: FieldErrors = {}, code = '', details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.details = details
  }
}

/** Thông điệp tiếng Việt cho các mã lỗi hay gặp; máy chủ gửi message thì ưu tiên dùng */
const CODE_MESSAGES: Record<string, string> = {
  CACE_NOT_STAFF: 'Tài khoản không có quyền vào trang quản trị',
  CACE_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  CACE_ACCOUNT_LOCKED: 'Tài khoản đã bị khoá. Liên hệ quản trị viên.',
  CACE_FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
  CACE_EMAIL_TAKEN: 'Email đã được dùng cho tài khoản khác',
  CACE_ROLE_CODE_TAKEN: 'Mã vai trò đã tồn tại',
  CACE_ROLE_SYSTEM: 'Không thể xoá vai trò hệ thống',
  CACE_ROLE_IN_USE: 'Vai trò đang có người dùng, không thể xoá',
  CACE_CANNOT_MODIFY_SELF: 'Không thể tự khoá, tự xoá hoặc tự đổi vai trò của chính mình',
  CACE_WRONG_PASSWORD: 'Mật khẩu hiện tại không đúng',
  CACE_PASSWORD_WEAK: 'Mật khẩu tối thiểu 8 ký tự, có cả chữ và số',
  CACE_TOKEN_EXPIRED: 'Liên kết đã hết hạn hoặc đã được dùng',
  CACE_RATE_LIMITED: 'Thao tác quá nhanh, vui lòng thử lại sau ít phút',
  CACE_NOT_FOUND: 'Không tìm thấy dữ liệu',
  CACE_TAXONOMY_TAKEN: 'Tên này đã có trong danh mục',
  CACE_TAXONOMY_IN_USE: 'Danh mục đang được case sử dụng, không thể xoá',
  CACE_CASE_SLUG_TAKEN: 'Đường dẫn đã được case khác dùng',
  CACE_CASE_EMPTY: 'Cần nội dung đề hoặc file PDF trước khi xuất bản',
  CACE_CRITERIA_INVALID: 'Tiêu chí chấm không hợp lệ: 1–10 tiêu chí, tổng trọng số bằng 100',
  CACE_CRITERIA_LOCKED: 'Case đã có bài nộp, không đổi được tiêu chí chấm',
  CACE_CASE_HAS_SUBMISSIONS: 'Case đã có bài làm — hãy ẩn case thay vì xoá',
  CACE_SUBMISSION_LOCKED: 'Người học vẫn còn được rút bài — chưa chấm được',
}

/** Mã lỗi luôn dùng câu chuẩn của CMS thay cho message máy chủ */
const FIXED_CODES = new Set(['CACE_NOT_STAFF', 'CACE_CASE_EMPTY'])

/** Mã lỗi gắn được vào một trường cụ thể của form */
export const CODE_FIELDS: Record<string, string> = {
  CACE_EMAIL_TAKEN: 'email',
  CACE_ROLE_CODE_TAKEN: 'code',
  CACE_WRONG_PASSWORD: 'currentPassword',
  CACE_PASSWORD_WEAK: 'password',
  CACE_TAXONOMY_TAKEN: 'name',
  CACE_CASE_SLUG_TAKEN: 'slug',
}

export function messageForCode(code: string): string | undefined {
  return CODE_MESSAGES[code]
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // Một số mã lỗi luôn dùng câu chuẩn của CMS
    if (FIXED_CODES.has(err.code)) return CODE_MESSAGES[err.code]
    return err.message || CODE_MESSAGES[err.code] || 'Đã có lỗi xảy ra, vui lòng thử lại'
  }
  if (err instanceof Error) return err.message
  return 'Đã có lỗi xảy ra, vui lòng thử lại'
}
