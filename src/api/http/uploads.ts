import type { DocumentUploadResult, UploadResult } from '@/types'
import { request } from './client'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024

const form = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return body
}

export const uploadApi = {
  /** Tải ảnh lên process upload (cổng 4002), trả url dạng /uploads/... */
  image: (file: File) => request<UploadResult>('/uploads/image', { method: 'POST', body: form(file) }),
  /** Tài liệu PDF (≤ 20 MB), trả kèm tên gốc */
  document: (file: File) => request<DocumentUploadResult>('/uploads/document', { method: 'POST', body: form(file) }),
}
