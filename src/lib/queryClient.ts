import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Lỗi 4xx (quyền, không tìm thấy) không thử lại
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
    mutations: { retry: false },
  },
})

/** Khoá cache dùng chung để invalidate sau khi thay đổi dữ liệu */
export const queryKeys = {
  stats: ['admin', 'stats'] as const,
  users: ['admin', 'users'] as const,
  userList: (q: object) => ['admin', 'users', 'list', q] as const,
  user: (id: string) => ['admin', 'users', 'detail', id] as const,
  roles: ['admin', 'roles'] as const,
  taxonomies: ['admin', 'case-taxonomies'] as const,
  taxonomyList: (type: string) => ['admin', 'case-taxonomies', type] as const,
  cases: ['admin', 'cases'] as const,
  caseList: (q: object) => ['admin', 'cases', 'list', q] as const,
  case: (id: string) => ['admin', 'cases', 'detail', id] as const,
  /** Ô chọn case trong bộ lọc bài nộp */
  caseOptions: ['admin', 'cases', 'options'] as const,
  submissions: ['admin', 'submissions'] as const,
  submissionList: (q: object) => ['admin', 'submissions', 'list', q] as const,
  submission: (id: string) => ['admin', 'submissions', 'detail', id] as const,
  competitions: ['admin', 'competitions'] as const,
  competitionList: (q: object) => ['admin', 'competitions', 'list', q] as const,
  competition: (id: string) => ['admin', 'competitions', 'detail', id] as const,
  teamPosts: ['admin', 'team-posts'] as const,
  teamPostList: (q: object) => ['admin', 'team-posts', 'list', q] as const,
}
