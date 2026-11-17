import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ExternalLink, FileText, FileUp, Trash2 } from 'lucide-react'
import { errorMessage, MAX_DOCUMENT_BYTES, uploadApi } from '@/api'
import { Button, Icon, IconButton, ProgressBar } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { formatBytes } from '@/utils/format'

export interface PdfValue {
  url: string
  name: string
  size: number | null
}

interface Props {
  value: PdfValue | null
  onChange(value: PdfValue | null): void
  disabled?: boolean
  /** Chữ trên ô tải lên, mặc định cho đề PDF */
  label?: string
  hint?: string
}

/** Tệp PDF (đề, dẫn giải): tải lên /api/uploads/document (≤ 20 MB) */
export function PdfUpload({
  value,
  onChange,
  disabled,
  label = 'Tải đề PDF lên',
  hint = 'Không bắt buộc nếu đã có nội dung đề. Tối đa 20 MB.',
}: Props) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useMutation({
    mutationFn: (file: File) => uploadApi.document(file),
    onSuccess: (res, file) => onChange({ url: res.url, name: res.originalName || file.name, size: res.size ?? file.size }),
    onError: (err) => toast.error(errorMessage(err)),
  })

  const pick = (file: File | undefined) => {
    if (!file) return
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    if (!isPdf) return toast.error('Chỉ nhận tệp PDF')
    if (file.size > MAX_DOCUMENT_BYTES) return toast.error('Tệp PDF tối đa 20 MB')
    upload.mutate(file)
  }
  const open = () => inputRef.current?.click()
  const pending = upload.variables && upload.isPending ? upload.variables : null

  return (
    <div className="pdf-upload">
      {pending ? (
        <div className="file-row">
          <span className="file-icon">
            <Icon icon={FileText} />
          </span>
          <div className="min-w-0 grow">
            <div className="file-name">{pending.name}</div>
            <div className="mo">Đang tải lên… {formatBytes(pending.size)}</div>
            <div className="file-progress">
              <ProgressBar value={100} />
            </div>
          </div>
        </div>
      ) : value ? (
        <div className="file-row">
          <span className="file-icon">
            <Icon icon={FileText} />
          </span>
          <div className="min-w-0 grow">
            <a className="file-name" href={value.url} target="_blank" rel="noreferrer" title="Mở tệp PDF">
              {value.name}
            </a>
            <div className="mo">PDF · {formatBytes(value.size)}</div>
          </div>
          <a className="icon-btn plain" href={value.url} target="_blank" rel="noreferrer" aria-label="Mở tệp PDF" title="Mở tệp PDF">
            <Icon icon={ExternalLink} />
          </a>
          <IconButton icon={Trash2} label="Gỡ tệp PDF" plain danger disabled={disabled} onClick={() => onChange(null)} />
        </div>
      ) : (
        <button type="button" className="upload-drop" onClick={open} disabled={disabled}>
          <Icon icon={FileUp} />
          <span>{label}</span>
          <small>{hint}</small>
        </button>
      )}
      {value && !pending && (
        <Button size="sm" icon={FileUp} disabled={disabled} onClick={open}>
          Thay tệp khác
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
