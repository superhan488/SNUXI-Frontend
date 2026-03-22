import { useAtom } from 'jotai';
import { Link, useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../../api/constants';
import { isLoggedInAtom, userRoleAtom } from '../../common/user';
import './navBar.css';

const NavBar = () => {
  const location = useLocation();
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [userRole] = useAtom(userRoleAtom);

  // 한글 메뉴명 적용
  const mainLinks = [
    { path: '/search-room', label: '택시팟 찾기' },
    { path: '/create-room', label: '택시팟 만들기' },
    { path: '/my-chat', label: '나의 택시팟' },
    { path: '/my-page', label: '마이페이지' },
  ];

  const isLinkActive = (path: string) => {
    if (path === '/search-room' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  const handleGoogleLogin = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    const googleLoginUrl = `${BACKEND_URL}/login?redirect_uri=${encodedUri}`;
    window.location.href = googleLoginUrl;
  };

  const handleLogout = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    window.location.href = `${BACKEND_URL}/logout?redirect_uri=${encodedUri}`;
  };

  return (
    <div className="nav-wrapper">
      <nav className="navBar">
        {/* 1. 좌측 로고 영역 */}
        <div className="logo">
          <Link to="/">
            <img src="/snuxi-logo.png" alt="SNUXI" />
          </Link>
        </div>

        {/* 2. 중앙 메인 네비게이션 영역 */}
        <div className="nav-center">
          {mainLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item ${isLinkActive(path) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* 3. 우측 로그인/관리자 영역 */}
        <div className="nav-right">
          {userRole === 'ADMIN' && (
            <Link to="/admin" className="admin-link">
              관리자
            </Link>
          )}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="login-button"
            >
              로그아웃
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login-button"
            >
              로그인
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
