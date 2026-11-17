import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ImagePlus, ImageUp, Trash2 } from 'lucide-react'
import { errorMessage, IMAGE_TYPES, MAX_IMAGE_BYTES, uploadApi } from '@/api'
import { Button, Icon, Spinner } from '@/components/ui'
import { useToast } from '@/contexts/toast'

interface Props {
  value: string | null
  onChange(url: string | null): void
  disabled?: boolean
}

/** Ảnh bìa case: tải lên /api/uploads/image, xem trước tỉ lệ 16:9 */
export function CoverUpload({ value, onChange, disabled }: Props) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useMutation({
    mutationFn: (file: File) => uploadApi.image(file),
    onSuccess: (res) => onChange(res.url),
    onError: (err) => toast.error(errorMessage(err)),
  })

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) return toast.error('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF')
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Ảnh tối đa 5 MB')
    upload.mutate(file)
  }
  const open = () => inputRef.current?.click()

  return (
    <div className="cover-upload">
      {value ? (
        <div className="cover-preview">
          <img src={value} alt="Ảnh bìa" />
          {upload.isPending && (
            <span className="uploading">
              <Spinner small />
            </span>
          )}
        </div>
      ) : (
        <button type="button" className="upload-drop" onClick={open} disabled={disabled || upload.isPending}>
          {upload.isPending ? <Spinner small /> : <Icon icon={ImagePlus} />}
          <span>{upload.isPending ? 'Đang tải ảnh lên…' : 'Chọn ảnh bìa'}</span>
          <small>JPG, PNG, WEBP hoặc GIF, tối đa 5 MB. Nên dùng tỉ lệ 16:9.</small>
        </button>
      )}
      {value && (
        <div className="row">
          <Button size="sm" icon={ImageUp} disabled={disabled} loading={upload.isPending} onClick={open}>
            Đổi ảnh
          </Button>
          <Button size="sm" variant="danger-ghost" icon={Trash2} disabled={disabled || upload.isPending} onClick={() => onChange(null)}>
            Gỡ ảnh
          </Button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
