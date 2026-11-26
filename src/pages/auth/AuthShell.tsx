import type { ReactNode } from 'react'
import { BriefcaseBusiness, Trophy, UsersRound } from 'lucide-react'
import { BrandLogo, Icon } from '@/components/ui'

const HIGHLIGHTS = [
  { icon: BriefcaseBusiness, title: 'Luyện giải case', text: 'Rèn luyện case kinh doanh có lời giải và chấm điểm' },
  { icon: Trophy, title: 'Cuộc thi', text: 'Tổ chức vòng thi, chấm bài và công bố kết quả' },
  { icon: UsersRound, title: 'Ghép đội', text: 'Kết nối người học tìm đồng đội phù hợp' },
]

/** Khung trang đăng nhập / quên mật khẩu: bảng thương hiệu bên trái, form bên phải */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-brand" aria-hidden="true">
        <div className="auth-brand-top">
          <BrandLogo tone="white" className="auth-wordmark" />
        </div>
        <div className="auth-brand-body">
          <p className="auth-eyebrow">Trang quản trị</p>
          <h2>Vận hành nền tảng luyện case kinh doanh cho người Việt</h2>
          <ul className="auth-highlights">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title}>
                <span className="auth-hl-icon">
                  <Icon icon={h.icon} />
                </span>
                <span>
                  <b>{h.title}</b>
                  <small>{h.text}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-brand-foot">© {new Date().getFullYear()} CACE · Case Competition Excellence</div>
        <div className="auth-orb one" />
        <div className="auth-orb two" />
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <BrandLogo className="auth-wordmark" />
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
