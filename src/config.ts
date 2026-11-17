export const config = {
  /** Mặc định gọi /api cùng origin (Vite / nginx proxy sang cace-api) */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  appName: 'CACE CMS',
  /** Mã vai được quản lý người dùng / vai trò (chưa có RBAC) */
  adminRoleCode: 'admin',
  /** Mã vai được quản lý nội dung (thư viện case, danh mục) */
  contentRoleCodes: ['admin', 'mentor'],
  /** Trang web người học, dùng cho nút "Xem trên web" */
  webUrl: (import.meta.env.VITE_WEB_URL || 'http://localhost:3100').replace(/\/$/, ''),
}
