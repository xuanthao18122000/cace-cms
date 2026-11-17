import { createContext, useContext } from 'react'
import type { LoginInput, User } from '@/types'

export interface AuthState {
  user: User | null
  /** Đang khôi phục phiên lúc mở app */
  initializing: boolean
  /** Phiên hết hạn khi đang có thay đổi chưa lưu: giữ trang, chờ đăng nhập lại */
  sessionExpired: boolean
  login(input: LoginInput): Promise<User>
  logout(): Promise<void>
  setUser(user: User): void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider')
  return ctx
}
