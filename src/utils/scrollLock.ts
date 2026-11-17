let locks = 0
let saved = { overflow: '', paddingRight: '' }

/**
 * Khoá cuộn trang khi mở drawer, hộp thoại.
 * Ẩn thanh cuộn sẽ làm trang rộng ra và giật sang phải, nên bù một khoảng
 * padding-right đúng bằng bề rộng thanh cuộn. Gọi lồng nhau được; trả về hàm mở khoá.
 */
export function lockScroll(): () => void {
  if (locks === 0) {
    const body = document.body
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    if (scrollbar > 0) {
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0
      body.style.paddingRight = `${current + scrollbar}px`
    }
    body.style.overflow = 'hidden'
  }
  locks++

  let released = false
  return () => {
    if (released) return
    released = true
    locks--
    if (locks === 0) {
      document.body.style.overflow = saved.overflow
      document.body.style.paddingRight = saved.paddingRight
    }
  }
}
