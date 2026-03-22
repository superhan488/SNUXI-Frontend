import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import React, { useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
import { withdrawUser } from '../../api/auth';
import { BACKEND_URL } from '../../api/constants';
import { updateProfilePicture, updateUsername } from '../../api/user';
import {
  emailAtom,
  isLoggedInAtom,
  nicknameAtom,
  profileImageAtom,
} from '../../common/user';
import './MyPage.css';

const MyPage = () => {
  const [isLoggedIn, _setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [email] = useAtom(emailAtom);
  const [nickname, setNickname] = useAtom(nicknameAtom);
  const [profileImage, setProfileImage] = useAtom(profileImageAtom);

  // 로컬 상태 관리 (수정 모드, 파일 객체 등)
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // 취소 시 되돌리기 위한 원래 이름 저장
  const [originalNickname, setOriginalNickname] = useState(nickname);

  // 파일 입력창(input type="file")을 열기 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로그인 핸들러 (버튼 클릭 시 호출)
  const handleLogin = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    const googleLoginUrl = `${BACKEND_URL}/login?redirect_uri=${encodedUri}`;
    window.location.href = googleLoginUrl;
  };

  // 이미지 업로드 핸들러 (미리보기 기능)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 클릭 시 파일 선택창 열기
  const triggerFileSelect = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalNickname(nickname);
  };

  // 저장 버튼 클릭 시
  const handleSave = async () => {
    try {
      if (profileImageFile) {
        const newImageUrl = await updateProfilePicture(profileImageFile);
        setProfileImage(newImageUrl);
      }

      await updateUsername(nickname);

      setIsEditing(false);
      alert('프로필이 수정되었습니다!');
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('프로필 수정 실패:', error.response?.data);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      alert('프로필 수정에 실패했습니다.');
      setNickname(originalNickname);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNickname(originalNickname);
  };

  const handleWithdraw = async () => {
    if (window.confirm('회원 탈퇴를 하시겠습니까? 모든 정보가 삭제됩니다.')) {
      try {
        await withdrawUser();
        alert('회원 탈퇴가 완료되었습니다.');
        const frontendRedirectUri = window.location.origin;
        const encodedUri = encodeURIComponent(frontendRedirectUri);
        window.location.href = `${BACKEND_URL}/logout?redirect_uri=${encodedUri}`;
      } catch (error) {
        console.error('회원 탈퇴 실패:', error);
        alert('회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 로그인되지 않은 경우 안내 문구와 로그인 버튼 표시 (MyChat 스타일 적용)
  if (!isLoggedIn) {
    return (
      <div className="mypage-container">
        <div className="mypage-no-login-container">
          <div className="mypage-no-login-text">
            로그인이 필요한 서비스입니다.
          </div>
          <button
            className="mypage-save-btn"
            onClick={handleLogin}
            style={{ fontSize: '1rem', padding: '10px 30px' }}
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <h1>마이페이지</h1>

      <div className="mypage-profile-card">
        {/* 프로필 이미지 영역 */}
        <div
          className="mypage-profile-image-wrapper"
          onClick={triggerFileSelect}
        >
          <img
            src={profileImage || 'https://via.placeholder.com/150?text=Profile'}
            alt="프로필 사진"
            className={`mypage-profile-image ${isEditing ? 'editable' : ''}`}
          />
          {isEditing && <div className="mypage-overlay">📷 변경</div>}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </div>

        {/* 사용자 정보 영역 */}
        <div className="mypage-profile-info">
          <div className="mypage-info-row">
            <label>이메일</label>
            <span className="mypage-email-text">
              {email || 'guest@snu.ac.kr'}
            </span>
          </div>

          <div className="mypage-info-row">
            <label>이름</label>
            {isEditing ? (
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mypage-nickname-input"
              />
            ) : (
              <span className="mypage-nickname-text">{nickname}</span>
            )}
          </div>
        </div>

        <div className="mypage-button-group">
          {isEditing ? (
            <>
              <button className="mypage-save-btn" onClick={handleSave}>
                저장
              </button>
              <button className="mypage-cancel-btn" onClick={handleCancel}>
                취소
              </button>
            </>
          ) : (
            <>
              <button className="mypage-edit-btn" onClick={handleEdit}>
                프로필 수정
              </button>
              <button className="mypage-withdraw-btn" onClick={handleWithdraw}>
                회원탈퇴
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
