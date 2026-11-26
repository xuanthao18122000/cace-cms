import type { LucideIcon } from 'lucide-react'

/** Icon lấy từ lucide-react; component nhận chính component icon, vd icon={Users} */
export type IconType = LucideIcon

export function Icon({ icon: I, className, size }: { icon: IconType; className?: string; size?: number }) {
  return (
    <I
      className={className ? `i ${className}` : 'i'}
      aria-hidden="true"
      style={size ? { width: size, height: size } : undefined}
    />
  )
}

/** Icon vuông: cúp trắng trên nền xanh (ảnh gốc theo brand guideline, giống favicon của web) - dùng khi sidebar thu gọn. */
export function LogoMark({ className = 'logo-mark' }: { className?: string }) {
  return <img className={className} src="/brand/icon.png" alt="" aria-hidden="true" width={72} height={72} draggable={false} />
}

/** Logo đầy đủ (Primary Logo trong brand guideline): ảnh gốc cúp + CACE + tagline. `tone="white"` cho nền xanh. */
export function BrandLogo({ className, tone = 'brand' }: { className?: string; tone?: 'brand' | 'white' }) {
  return (
    <img
      className={className}
      src={tone === 'white' ? '/brand/cace-logo-white.png' : '/brand/cace-logo.png'}
      alt="CACE"
      width={959}
      height={264}
      draggable={false}
    />
  )
}
