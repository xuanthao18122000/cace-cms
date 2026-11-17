import { useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ImageUp, Trash2 } from 'lucide-react'
import { errorMessage, IMAGE_TYPES, MAX_IMAGE_BYTES, uploadApi } from '@/api'
import { Avatar, Button, Spinner } from '@/components/ui'
import { useToast } from '@/contexts/toast'

interface Props {
  name: string
  value: string | null
  onChange(url: string | null): void
  disabled?: boolean
}

/** Chọn ảnh → tải lên /api/uploads/image → trả url về form */
export function AvatarUpload({ name, value, onChange, disabled }: Props) {
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

  return (
    <div className="avatar-upload">
      <span className="avatar-frame">
        <Avatar name={name || '?'} src={value} size="lg" />
        {upload.isPending && (
          <span className="uploading">
            <Spinner small />
          </span>
        )}
      </span>
      <div className="avatar-upload-actions">
        <div className="row">
          <Button size="sm" icon={ImageUp} disabled={disabled} loading={upload.isPending} onClick={() => inputRef.current?.click()}>
            {value ? 'Đổi ảnh' : 'Tải ảnh lên'}
          </Button>
          {value && (
            <Button size="sm" variant="danger-ghost" icon={Trash2} disabled={disabled || upload.isPending} onClick={() => onChange(null)}>
              Xoá ảnh
            </Button>
          )}
        </div>
        <span className="mo">JPG, PNG, WEBP hoặc GIF, tối đa 5 MB</span>
      </div>
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
