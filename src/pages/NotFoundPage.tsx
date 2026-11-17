import { useNavigate } from 'react-router-dom'
import { House, MapPinOff } from 'lucide-react'
import { Button, Card, EmptyHero } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Card>
      <EmptyHero
        icon={MapPinOff}
        tone="gray"
        title="Không tìm thấy trang"
        message="Đường dẫn không tồn tại hoặc bạn không có quyền truy cập."
        actions={
          <Button variant="primary" icon={House} onClick={() => navigate('/')}>
            Về Dashboard
          </Button>
        }
      />
    </Card>
  )
}
