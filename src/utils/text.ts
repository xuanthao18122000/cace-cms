/** Bỏ dấu tiếng Việt, chữ thường: tìm "nguyen" ra "Nguyễn" */
export function normalizeText(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/** Mã vai trò: a-z0-9_- từ tên, vd "Ban giám khảo" → "ban-giam-khao" */
export function slugify(s: string) {
  return normalizeText(s)
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

/** Đường dẫn case: chỉ a-z0-9 và gạch ngang, vd "Đường tới VinFast" → "duong-toi-vinfast" */
export function toSlug(s: string, max = 200) {
  return normalizeText(s)
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, max)
    .replace(/^-+|-+$/g, '')
}
