import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// 페이지 이동 시 이전 스크롤 위치 대신 맨 위에서 시작하도록 합니다.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
