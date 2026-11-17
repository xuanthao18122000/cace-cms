import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi, tokenStore, UNAUTHORIZED_EVENT } from '@/api'
import { hasUnsavedChanges } from '@/hooks/useUnsavedChanges'
import type { LoginInput, User } from '@/types'
import { AuthContext, type AuthState } from './auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Mở app: còn access token thì dùng; không thì thử khôi phục phiên từ cookie refresh
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!tokenStore.get() && !(await authApi.restore())) return
        const me = await authApi.me()
        // Phiên của người học (đăng nhập từ web) không dùng được ở CMS
        if (!me.isStaff) {
          tokenStore.clear()
          return
        }
        if (!cancelled) setUser(me)
      } catch {
        tokenStore.clear()
      } finally {
        if (!cancelled) setInitializing(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      // Đang có thay đổi chưa lưu: giữ nguyên trang và cache, hỏi đăng nhập lại tại chỗ (RequireAuth)
      // thay vì gỡ cả layout làm mất nội dung đang soạn
      if (hasUnsavedChanges()) return setSessionExpired(true)
      setSessionExpired(false)
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [queryClient])

  const login = useCallback(async (input: LoginInput) => {
    const result = await authApi.login(input)
    setUser(result.user)
    if (sessionExpired) {
      // Đăng nhập lại sau khi hết phiên: tải lại các truy vấn vừa lỗi 401
      setSessionExpired(false)
      void queryClient.invalidateQueries()
    }
    return result.user
  }, [queryClient, sessionExpired])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      tokenStore.clear()
      setSessionExpired(false)
      setUser(null)
      queryClient.clear()
    }
  }, [queryClient])

  const value = useMemo<AuthState>(
    () => ({ user, initializing, sessionExpired, login, logout, setUser }),
    [user, initializing, sessionExpired, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
