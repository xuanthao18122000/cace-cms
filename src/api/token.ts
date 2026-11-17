const KEY = 'cace.cms.token'

/**
 * Access token (ngắn hạn). Giữ trong bộ nhớ + sessionStorage để tải lại trang không phải gọi refresh;
 * phiên dài hạn nằm ở cookie refresh httpOnly `cace_refresh` do API quản lý.
 */
let memory: string | null = null

export const tokenStore = {
  get(): string | null {
    if (memory) return memory
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    memory = token
    try {
      sessionStorage.setItem(KEY, token)
    } catch {
      // Trình duyệt chặn storage: token chỉ sống trong bộ nhớ
    }
  },
  clear() {
    memory = null
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      // bỏ qua
    }
  },
}

/** Phát ra khi phiên hết hạn hẳn (refresh cũng thất bại) để AuthProvider đưa về trang đăng nhập */
export const UNAUTHORIZED_EVENT = 'cace:unauthorized'
