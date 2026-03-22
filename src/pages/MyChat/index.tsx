import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLandmarks } from '../../api/map';
import type { Pot } from '../../api/room';
import { getCurrentPot, leaveRoom } from '../../api/room';
import './MyChat.css';

const MyChat = () => {
  const [currentPot, setCurrentPot] = useState<Pot | null>(null);
  const [landmarks, setLandmarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchLandmarksData = useCallback(async () => {
    try {
      const data = await getLandmarks();
      if (data && data.landmarks) {
        const landmarksMap: Record<number, string> = {};
        // biome-ignore lint/suspicious/noExplicitAny:
        data.landmarks.forEach((l: any) => {
          landmarksMap[l.id] = l.name;
        });
        setLandmarks(landmarksMap);
      }
    } catch (error) {
      console.error('랜드마크 정보를 불러오지 못했습니다:', error);
    }
  }, []);

  const fetchCurrentPot = useCallback(async () => {
    try {
      const pot = await getCurrentPot();
      if (!pot) {
        setCurrentPot(null);
      } else {
        setCurrentPot(pot);
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Error fetching current pot:', error.response?.data);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      setCurrentPot(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLandmarksData(), fetchCurrentPot()]);
      setLoading(false);
    };
    init();
  }, [fetchLandmarksData, fetchCurrentPot]);

  const handleLeave = async () => {
    if (currentPot) {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('현재 방에서 나가시겠습니까?')) {
        try {
          await leaveRoom(currentPot.id);
          alert('방에서 나갔습니다.');
          fetchCurrentPot();
        } catch (_error: unknown) {
          alert('방에서 나가는 중 오류가 발생했습니다.');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="my-chat-container loading-container">
        <div className="loading-text">로딩 중...</div>
      </div>
    );
  }

  // 상태 배지 렌더링 함수
  const renderStatusBadges = () => {
    if (!currentPot) return null;

    const { status, isLocked } = currentPot;
    const badges = [];

    // 1. 모집 상태 판단 (RECRUITING or SUCCESS)
    if (status === 'RECRUITING' || status === 'SUCCESS') {
      if (isLocked) {
        // 방장이 잠금을 걸었으면 '모집중지' (노랑)
        badges.push({ text: '모집중지', type: 'locked' });
      } else {
        // 잠금이 없으면 '모집중' (초록)
        badges.push({ text: '모집중', type: 'recruiting' });
      }
    }

    // 2. 출발 확정 판단 (SUCCESS)
    // SUCCESS 상태면 위의 모집 상태 뒤에 '출발확정' (파랑) 추가
    if (status === 'SUCCESS') {
      badges.push({ text: '출발확정', type: 'success' });
    }

    // 3. 그 외 상태 (FAILED, EXPIRED 등)
    if (status !== 'RECRUITING' && status !== 'SUCCESS') {
      badges.push({ text: '마감', type: 'closed' });
    }

    return (
      <div className="status-badge-group">
        {badges.map((badge, index) => (
          <span key={index} className={`status-badge ${badge.type}`}>
            {badge.text}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="my-chat-container">
      {!currentPot ? (
        <div className="no-pot-message">현재 참여 중인 팟이 없습니다.</div>
      ) : (
        <>
          <h1 className="page-title">나의 택시팟</h1>
          <div className="current-pot-card">
            <Link
              to={`/chat/${currentPot.id}`}
              className="pot-link"
              state={{
                unreadCount: currentPot.unreadCount, // 표시는 기존대로 유지
                totalUnreadCount: currentPot.totalUnreadCount, // [수정] 메시지 로딩을 위해 추가 전달
                totalMembers: currentPot.currentCount,
              }}
            >
              <div className="pot-details">
                <div className="pot-info">
                  <div className="location">
                    {landmarks[currentPot.departureId] || '알 수 없음'}
                  </div>

                  <div className="route-destination-row">
                    <span className="arrow">→</span>
                    <span className="location">
                      {landmarks[currentPot.destinationId] || '알 수 없음'}
                    </span>
                    {currentPot.unreadCount > 0 && (
                      <span className="unread-badge">
                        {currentPot.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pot-meta">
                  <span className="time">
                    {new Date(currentPot.departureTime).toLocaleString(
                      'ko-KR',
                      {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </span>

                  {renderStatusBadges()}

                  <span className="headcount-fixed">
                    {currentPot.currentCount}/{currentPot.maxCapacity}
                  </span>
                </div>
              </div>
            </Link>
            <button className="leave-button" onClick={handleLeave}>
              나가기
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MyChat;
