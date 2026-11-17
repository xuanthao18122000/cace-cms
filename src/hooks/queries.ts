import { useQuery } from '@tanstack/react-query'
import { roleApi, taxonomyApi } from '@/api'
import { queryKeys } from '@/lib/queryClient'
import type { TaxonomyType } from '@/types'

/** Danh sách vai trò (không phân trang), dùng cho bộ lọc và ô chọn vai */
export function useRolesQuery(enabled = true) {
  return useQuery({ queryKey: queryKeys.roles, queryFn: () => roleApi.list(), enabled })
}

/** Danh mục case theo loại (gồm cả mục đang ẩn), dùng cho trang danh mục, bộ lọc và ô chọn */
export function useTaxonomiesQuery(type: TaxonomyType) {
  return useQuery({ queryKey: queryKeys.taxonomyList(type), queryFn: () => taxonomyApi.list(type) })
}
