import { useState } from 'react'
import { Dialog, Field, Input } from '@/components/ui'

interface Props {
  /** Link hiện tại của đoạn chữ đang chọn ('' nếu chưa có) */
  initial: string
  onClose(): void
  /** '' = gỡ link */
  onSubmit(href: string): void
}

/** Thêm https:// khi người dùng gõ thiếu, giữ nguyên mailto:, tel:, đường dẫn nội bộ */
function normalizeHref(v: string) {
  const s = v.trim()
  if (!s) return ''
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(s)) return s
  return `https://${s}`
}

export function LinkDialog({ initial, onClose, onSubmit }: Props) {
  const [value, setValue] = useState(initial)
  return (
    <Dialog
      open
      title={initial ? 'Sửa liên kết' : 'Chèn liên kết'}
      description="Để trống rồi bấm Lưu để gỡ liên kết."
      submitLabel="Lưu"
      onClose={onClose}
      onSubmit={() => onSubmit(normalizeHref(value))}
    >
      <Field label="Địa chỉ" htmlFor="rte-link">
        <Input id="rte-link" type="url" inputMode="url" placeholder="https://..." value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
    </Dialog>
  )
}
