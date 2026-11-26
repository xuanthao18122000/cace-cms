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

const BRAND = '#215bee'
const TAGLINE = 'ACE YOUR CASE · BUILD YOUR BASE'

/** Cúp CACE (giống cace-web): thân cúp theo `currentColor`, ngôi sao theo `star`. */
function TrophyGlyph({ star }: { star: string }) {
  return (
    <g>
      <path d="M14 3h36v19c0 12-8 20-18 20S14 34 14 22z" />
      <path d="M14 9H4v8c0 10 7 16 14 17M50 9h10v8c0 10-7 16-14 17" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M28 41h8v11c0 4 3 7 8 9H20c5-2 8-5 8-9z" />
      <rect x="16" y="61" width="32" height="9" rx="2" />
      <path fill={star} d="m32 9 2.7 7.28 7.76.32-6.09 4.82 2.1 7.48L32 24.6l-6.47 4.3 2.1-7.48-6.09-4.82 7.76-.32z" />
    </g>
  )
}

/** Icon vuông: cúp trắng trên nền xanh (giống favicon của web) - dùng khi sidebar thu gọn. */
export function LogoMark({ className = 'logo-mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
      <rect width="72" height="72" rx="18" fill={BRAND} />
      <g transform="translate(8.5 8) scale(.85 .78)" fill="#fff" color="#fff">
        <TrophyGlyph star={BRAND} />
      </g>
    </svg>
  )
}

/** Logo đầy đủ giống cace-web: cúp + chữ CACE + tagline. `tone="white"` cho nền xanh. */
export function BrandLogo({
  className,
  tone = 'brand',
  showTagline = true,
}: {
  className?: string
  tone?: 'brand' | 'white'
  showTagline?: boolean
}) {
  const white = tone === 'white'
  return (
    <svg
      className={className}
      viewBox={showTagline ? '0 0 322 94' : '0 0 322 73'}
      fill="currentColor"
      style={{ color: white ? '#fff' : BRAND }}
      role="img"
      aria-label="CACE"
    >
      <TrophyGlyph star={white ? BRAND : '#fff'} />
      <g transform="translate(78 2)">
        <path d="M52.2 19.6A24.5 24.5 0 1 0 52.2 52.4" fill="none" stroke="currentColor" strokeWidth="17" />
        <path fillRule="evenodd" d="M62 69 89 3h18l27 66h-18l-4.5-12h-27L80 69zM90.5 43h15L98 21z" />
        <path d="M185.2 19.6A24.5 24.5 0 1 0 185.2 52.4" fill="none" stroke="currentColor" strokeWidth="17" />
        <path d="M197 3h47v15h-30v10.5h27V43h-27v11h30v15h-47z" />
      </g>
      {showTagline && (
        <text x="78" y="91" textLength="244" lengthAdjust="spacing" fontSize="13" fontWeight="700">
          {TAGLINE}
        </text>
      )}
    </svg>
  )
}
