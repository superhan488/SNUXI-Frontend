import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (
      path === '/search-room' &&
      (location.pathname === '/' || location.pathname === '/search-room')
    )
      return true;
    return location.pathname.startsWith(path) && path !== '/search-room';
  };

  return (
    <nav className="bottom-nav">
      {/* 홈 */}
      <Link
        to="/search-room"
        className={`bn-item ${isActive('/search-room') ? 'active' : ''}`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
        <span>홈</span>
      </Link>

      {/* 만들기 */}
      <Link
        to="/create-room"
        className={`bn-item ${isActive('/create-room') ? 'active' : ''}`}
      >
        <div className="bn-create-btn">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span>만들기</span>
      </Link>

      {/* 내 팟 */}
      <Link
        to="/my-chat"
        className={`bn-item ${isActive('/my-chat') ? 'active' : ''}`}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 11l1.5-4.5h11L19 11" />
          <rect x="2" y="11" width="20" height="7" rx="2" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
          <path d="M2 15h20" />
        </svg>
        <span>내 팟</span>
      </Link>

      {/* MY */}
      <Link
        to="/my-page"
        className={`bn-item ${isActive('/my-page') ? 'active' : ''}`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>MY</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
