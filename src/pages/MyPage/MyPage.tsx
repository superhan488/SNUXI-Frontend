import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { withdrawUser } from '../../api/auth';
import { BACKEND_URL } from '../../api/constants';
import { updateProfilePicture, updateUsername } from '../../api/user';
import {
  emailAtom,
  isLoggedInAtom,
  nicknameAtom,
  profileImageAtom,
} from '../../common/user';
import {
  getNotificationPermission,
  isNotificationSupported,
  isNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
} from '../../utils/notifications';
import './MyPage.css';

const MyPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, _setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [email] = useAtom(emailAtom);
  const [nickname, setNickname] = useAtom(nicknameAtom);
  const [profileImage, setProfileImage] = useAtom(profileImageAtom);

  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState(nickname);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [notificationsEnabled, setNotificationsEnabledState] = useState(
    isNotificationsEnabled
  );
  const [notificationPermission, setNotificationPermission] = useState(
    getNotificationPermission
  );

  const handleLogin = () => {
    const uri = encodeURIComponent(window.location.origin);
    window.location.href = `${BACKEND_URL}/login?redirect_uri=${uri}`;
  };

  const handleLogout = () => {
    const uri = encodeURIComponent(window.location.origin);
    window.location.href = `${BACKEND_URL}/logout?redirect_uri=${uri}`;
  };

  const handleSave = async () => {
    try {
      if (profileImageFile) {
        const newImageUrl = await updateProfilePicture(profileImageFile);
        setProfileImage(newImageUrl);
      }
      await updateUsername(editNickname);
      setNickname(editNickname);
      setIsEditing(false);
      setPreviewImage(null);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('프로필 수정 실패:', error.response?.data);
      }
      alert('프로필 수정에 실패했습니다.');
      setEditNickname(nickname);
    }
  };

  const handleWithdraw = async () => {
    if (window.confirm('회원 탈퇴를 하시겠습니까? 모든 정보가 삭제됩니다.')) {
      try {
        await withdrawUser();
        alert('회원 탈퇴가 완료되었습니다.');
        const uri = encodeURIComponent(window.location.origin);
        window.location.href = `${BACKEND_URL}/logout?redirect_uri=${uri}`;
      } catch {
        alert('회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleToggleNotifications = async () => {
    if (!isNotificationSupported()) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationPermission(getNotificationPermission());
      if (granted) {
        setNotificationsEnabled(true);
        setNotificationsEnabledState(true);
      } else {
        alert(
          '알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.'
        );
      }
    } else {
      setNotificationsEnabled(false);
      setNotificationsEnabledState(false);
    }
  };

  const avatarInitial = nickname ? nickname[0] : '?';
  const avatarSrc = previewImage || profileImage;

  if (!isLoggedIn) {
    return (
      <div className="mp-container">
        <div className="mp-app-bar">
          <Link to="/" className="mp-app-bar-logo">
            SNUXI
          </Link>
          <button
            type="button"
            className="mp-app-bar-bell"
            onClick={handleToggleNotifications}
            aria-label={notificationsEnabled ? '알림 끄기' : '알림 켜기'}
          >
            {notificationsEnabled ? (
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
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
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
                strokeLinejoin="round"
              >
                <path d="M13.73 21a2 2 0 01-3.46 0" />
                <path d="M18.63 13A17.89 17.89 0 0118 8" />
                <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" />
                <path d="M18 8a6 6 0 00-9.33-5" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            )}
          </button>
        </div>
        <div className="mp-not-logged-in">
          <div className="mp-not-logged-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p>로그인이 필요한 서비스입니다.</p>
          <button className="mp-login-btn" onClick={handleLogin}>
            로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-container">
      <div className="mp-app-bar">
        <Link to="/" className="mp-app-bar-logo">
          SNUXI
        </Link>
        <button
          type="button"
          className="mp-app-bar-bell"
          onClick={handleToggleNotifications}
          aria-label={notificationsEnabled ? '알림 끄기' : '알림 켜기'}
        >
          {notificationsEnabled ? (
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
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
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
              strokeLinejoin="round"
            >
              <path d="M13.73 21a2 2 0 01-3.46 0" />
              <path d="M18.63 13A17.89 17.89 0 0118 8" />
              <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" />
              <path d="M18 8a6 6 0 00-9.33-5" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          )}
        </button>
      </div>
      <h1 className="mp-title">마이페이지</h1>

      {/* 프로필 카드 */}
      <div className="mp-profile-card">
        <div className="mp-avatar-wrap">
          {avatarSrc ? (
            <img src={avatarSrc} alt="프로필" className="mp-avatar-img" />
          ) : (
            <div className="mp-avatar-initial">{avatarInitial}</div>
          )}
          {isEditing && (
            <label className="mp-avatar-edit-btn" htmlFor="mp-file-input">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <input
                id="mp-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfileImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () =>
                      setPreviewImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </div>
        <div className="mp-profile-info">
          {isEditing ? (
            <input
              className="mp-nickname-input"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
            />
          ) : (
            <div className="mp-name">{nickname}</div>
          )}
          <div className="mp-email">{email}</div>
        </div>
        <div className="mp-profile-actions">
          {isEditing ? (
            <>
              <button className="mp-btn-save" onClick={handleSave}>
                저장
              </button>
              <button
                className="mp-btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  setEditNickname(nickname);
                  setPreviewImage(null);
                }}
              >
                취소
              </button>
            </>
          ) : (
            <button
              className="mp-btn-edit"
              onClick={() => {
                setIsEditing(true);
                setEditNickname(nickname);
              }}
            >
              프로필 수정
            </button>
          )}
        </div>
      </div>

      {/* 설정 섹션 */}
      <div className="mp-section-label">설정</div>
      <div className="mp-list">
        {/* 알림 */}
        <div className="mp-list-item mp-notify-item">
          <div className="mp-list-left">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mp-list-icon"
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <div>
              <div className="mp-list-text">알림</div>
              {notificationPermission === 'denied' && (
                <div className="mp-notify-denied">
                  주소창 🔒 → 알림 → 허용 후 새로고침
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className={`mp-toggle ${notificationsEnabled ? 'on' : 'off'}`}
            onClick={handleToggleNotifications}
            disabled={
              !isNotificationSupported() || notificationPermission === 'denied'
            }
          >
            <span className="mp-toggle-thumb" />
          </button>
        </div>

        <div className="mp-divider" />

        {/* 관리자 페이지 — superhan488@snu.ac.kr 전용 */}
        {(email === 'superhan488@snu.ac.kr' || email === 'yujatea97@snu.ac.kr') && (
          <>
            <button
              className="mp-list-item mp-list-btn"
              onClick={() => navigate('/admin')}
            >
              <div className="mp-list-left">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mp-list-icon"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="mp-list-text">관리자 페이지</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <div className="mp-divider" />
          </>
        )}

        {/* 이용약관 */}
        <button
          className="mp-list-item mp-list-btn"
          onClick={() => navigate('/terms')}
        >
          <div className="mp-list-left">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mp-list-icon"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            <span className="mp-list-text">이용약관</span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mp-chevron"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div className="mp-divider" />

        {/* 로그아웃 */}
        <button className="mp-list-item mp-list-btn" onClick={handleLogout}>
          <div className="mp-list-left">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mp-list-icon logout"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="mp-list-text logout">로그아웃</span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mp-chevron"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <button className="mp-withdraw-btn" onClick={handleWithdraw}>
        회원탈퇴
      </button>
    </div>
  );
};

export default MyPage;
