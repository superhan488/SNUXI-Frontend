import { useAtom } from 'jotai';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../../api/constants';
import { isLoggedInAtom, userRoleAtom } from '../../common/user';
import './navBar.css';

const NavBar = () => {
  const location = useLocation();
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [userRole] = useAtom(userRoleAtom);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainLinks = [
    { path: '/search-room', label: '택시팟 찾기' },
    { path: '/my-chat', label: '나의 택시팟' },
  ];

  const isLinkActive = (path: string) => {
    if (path === '/search-room' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  const handleGoogleLogin = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    window.location.href = `${BACKEND_URL}/login?redirect_uri=${encodedUri}`;
  };

  const handleLogout = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    window.location.href = `${BACKEND_URL}/logout?redirect_uri=${encodedUri}`;
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <div className="nav-wrapper">
        <nav className="navBar">
          {/* Logo */}
          <div className="logo">
            <Link to="/" onClick={closeMenu}>
              <img src="/snuxi-logo.png" alt="SNUXI" />
            </Link>
          </div>

          {/* Center nav — desktop only */}
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

          {/* Right — desktop only */}
          <div className="nav-right">
            {userRole === 'ADMIN' && (
              <Link to="/admin" className="admin-link">
                관리자
              </Link>
            )}
            <Link
              to="/my-page"
              className={`mypage-icon-link ${isLinkActive('/my-page') ? 'active' : ''}`}
            >
              마이페이지
            </Link>
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

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="메뉴"
          >
            {isMenuOpen ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="mobile-menu">
          {mainLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`mobile-menu-item ${isLinkActive(path) ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/my-page"
            className={`mobile-menu-item ${isLinkActive('/my-page') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            마이페이지
          </Link>
          {userRole === 'ADMIN' && (
            <Link
              to="/admin"
              className="mobile-menu-item admin"
              onClick={closeMenu}
            >
              관리자
            </Link>
          )}
          <div className="mobile-menu-divider" />
          {isLoggedIn ? (
            <button
              type="button"
              className="mobile-login-btn"
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
            >
              로그아웃
            </button>
          ) : (
            <button
              type="button"
              className="mobile-login-btn"
              onClick={() => {
                handleGoogleLogin();
                closeMenu();
              }}
            >
              로그인
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default NavBar;
