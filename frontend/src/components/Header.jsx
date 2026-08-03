import { NavLink } from 'react-router-dom'

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="brand__icon"
      viewBox="0 0 48 48"
      fill="none"
    >
      <path
        d="M24 4 40 10v11.4c0 10.3-6.5 18.8-16 22.6C14.5 40.2 8 31.7 8 21.4V10L24 4Z"
        fill="currentColor"
        opacity=".16"
      />
      <path
        d="M24 4 40 10v11.4c0 10.3-6.5 18.8-16 22.6C14.5 40.2 8 31.7 8 21.4V10L24 4Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="m17 24 4.5 4.5L31.5 18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Header() {
  return (
    <header className="site-header">
      <nav className="nav-container" aria-label="주요 메뉴">
        <NavLink className="brand" to="/" aria-label="First Penguin 홈">
          <ShieldIcon />
          <span className="brand__text">
            <strong>First Penguin</strong>
            <small>킥보드 헬멧 미착용 탐지</small>
          </span>
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            ['nav-link', isActive ? 'nav-link--active' : '']
              .filter(Boolean)
              .join(' ')
          }
          to="/intro"
        >
          서비스 소개
        </NavLink>
      </nav>
    </header>
  )
}

export default Header
