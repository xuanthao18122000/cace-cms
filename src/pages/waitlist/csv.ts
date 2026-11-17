type Cell = string | number | null | undefined

/**
 * Một ô CSV: bọc ngoặc kép khi cần, nhân đôi ngoặc kép bên trong.
 * Giá trị bắt đầu bằng = + - @ (hoặc tab / CR) được thêm `'` để Excel không chạy như công thức.
 */
function cell(value: Cell): string {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}

/** Tải tệp CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt) */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
