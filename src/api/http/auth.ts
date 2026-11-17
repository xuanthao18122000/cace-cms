import type { AuthResult, ChangePasswordInput, LoginInput, UpdateProfileInput, User } from '@/types'
import { tokenStore } from '../token'
import { refreshAccessToken, request } from './client'

export const authApi = {
  /** Đăng nhập CMS: vai `user` bị chặn bằng 403 CACE_NOT_STAFF */
  async login(input: LoginInput): Promise<AuthResult> {
    const res = await request<AuthResult>('/auth/cms/login', { method: 'POST', body: input, noRefresh: true })
    tokenStore.set(res.accessToken)
    return res
  },
  restore: () => refreshAccessToken(),
  async logout() {
    await request('/auth/logout', { method: 'POST', noRefresh: true }).catch(() => undefined)
    tokenStore.clear()
  },
  me: () => request<User>('/auth/me'),
  updateProfile: (input: UpdateProfileInput) => request<User>('/auth/me', { method: 'PATCH', body: input }),
  async changePassword(input: ChangePasswordInput): Promise<User> {
    // Máy chủ đăng xuất các phiên khác: dùng access token mới trả về
    const res = await request<AuthResult>('/auth/change-password', { method: 'POST', body: input })
    tokenStore.set(res.accessToken)
    return res.user
  },
  forgotPassword: (email: string) =>
    request<null>('/auth/forgot-password', { method: 'POST', body: { email, source: 'cms' }, noRefresh: true }),
  resetPassword: (token: string, password: string) =>
    request<null>('/auth/reset-password', { method: 'POST', body: { token, password }, noRefresh: true }),
}
