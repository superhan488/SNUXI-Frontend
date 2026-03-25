import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLandmarks } from '../../api/map';
import { createRoom, getUserPots } from '../../api/room';
import { isLoggedInAtom } from '../../common/user';
import BellToggle from '../../components/BellToggle';
import {
  isNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
} from '../../utils/notifications';
import './CreateRoom.css';

interface Landmark {
  id: number;
  name: string;
}

const CreateRoom = () => {
  const navigate = useNavigate();
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [departureTime, setDepartureTime] = useState(() => {
    const now = new Date(Date.now() + 60000);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [minCapacity, setMinCapacity] = useState(2);
  const [notifyEnabled, setNotifyEnabled] = useState(isNotificationsEnabled);
  const [notifyPermission, setNotifyPermission] = useState(() =>
    'Notification' in window
      ? Notification.permission
      : ('denied' as NotificationPermission)
  );

  useEffect(() => {
    const fetchLandmarksData = async () => {
      try {
        const data = await getLandmarks();
        if (data && data.landmarks) {
          setLandmarks(data.landmarks);
        }
      } catch (error) {
        console.error('Error fetching landmarks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLandmarksData();
  }, []);

  const handleSwap = () => {
    const tmp = start;
    setStart(end);
    setEnd(tmp);
  };

  const handleMinCapacityChange = (amount: number) => {
    setMinCapacity((prev) => {
      const newValue = prev + amount;
      if (newValue >= 2 && newValue <= 4) return newValue;
      return prev;
    });
  };

  const handleCreateRoom = async () => {
    if (!start || !end || !departureTime || !minCapacity) {
      alert('모든 필드를 채워주세요.');
      return;
    }
    if (!isLoggedIn) {
      navigate('/my-page');
      return;
    }
    if (start === end) {
      alert('출발지와 도착지를 다르게 입력해주세요.');
      return;
    }
    try {
      const pots = await getUserPots();
      if (pots.length >= 3) {
        alert('최대 3개 방을 참여할 수 있습니다.');
        return;
      }
    } catch {
      // proceed if check fails
    }

    const departureId = parseInt(start, 10);
    const destinationId = parseInt(end, 10);
    // UTC 변환 없이 사용자가 선택한 한국 시간 그대로 전송
    const departureTimeISO = `${departureTime}:00`;


    const roomDetails = {
      departureId,
      destinationId,
      departureTime: departureTimeISO,
      minCapacity,
      maxCapacity: 4,
      estimatedFee: 5000,
    };

    try {
      await createRoom(roomDetails);

      if (notifyEnabled) {
        const granted = await requestNotificationPermission();
        setNotificationsEnabled(granted);
      } else {
        setNotificationsEnabled(false);
      }

      alert('방이 성공적으로 개설되었습니다!');
      navigate('/search-room');
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data) {
        // biome-ignore lint/suspicious/noExplicitAny: 서버 에러 구조 대응
        const data = error.response.data as any;
        console.error('방 개설 에러 응답:', JSON.stringify(data));
        const errMsg: string = data.errMsg || data.message || data.error || '';
        // 딥링크 오류는 방 생성 자체는 성공 — 소프트 경고 후 이동
        if (errMsg.includes('딥링크')) {
          navigate('/search-room');
          return;
        }
        // 시간 관련 오류는 사용자에게 노출하지 않음 (effectiveTime으로 이미 보정)
        if (errMsg.includes('이후') || errMsg.includes('시간') || errMsg.includes('time')) {
          alert('방 개설 중 오류가 발생했습니다. 다시 시도해주세요.');
          return;
        }
        alert(errMsg || '방 개설 중 오류가 발생했습니다.');
      } else {
        alert('방 개설 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDateBoxClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (_error) {
        dateInputRef.current.focus();
      }
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '날짜와 시간을 선택해주세요';
    const date = new Date(dateString);
    const isToday = date.toDateString() === new Date().toDateString();
    const isTomorrow =
      date.toDateString() === new Date(Date.now() + 86400000).toDateString();
    const prefix = isToday ? '오늘' : isTomorrow ? '내일' : '';
    const time = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return prefix
      ? `${prefix} · ${time}`
      : date.toLocaleString('ko-KR', {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
  };

  if (loading) {
    return (
      <div className="create-container loading-container">
        <div className="loading-text">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="create-container">
      <div className="create-app-bar">
        <Link to="/" className="create-app-bar-logo">
          SNUXI
        </Link>
        <BellToggle className="create-app-bar-bell" />
      </div>
      <h1 className="create-title">택시팟 만들기</h1>

      {/* 경로 */}
      <div className="card">
        <div className="card-label">경로</div>
        <div className="location-box">
          <div className="location-select">
            <select value={start} onChange={(e) => setStart(e.target.value)}>
              <option value="">출발지</option>
              {landmarks.map((landmark) => (
                <option
                  key={`start-${landmark.id}`}
                  value={String(landmark.id)}
                >
                  {landmark.name}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="swap-btn" onClick={handleSwap}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          <div className="location-select">
            <select value={end} onChange={(e) => setEnd(e.target.value)}>
              <option value="">도착지</option>
              {landmarks.map((landmark) => (
                <option key={`end-${landmark.id}`} value={String(landmark.id)}>
                  {landmark.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 출발 시간 */}
      <div className="card">
        <div className="card-label">출발 시간</div>
        <div className="custom-date-input-wrapper" onClick={handleDateBoxClick}>
          <input
            ref={dateInputRef}
            type="datetime-local"
            className="hidden-date-input"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            min={(() => {
              const now = new Date(Date.now() + 60000);
              return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            })()}
            step="60"
          />
          <div className={`date-display-box ${departureTime ? 'active' : ''}`}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 10, flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="date-text">
              {formatDisplayDate(departureTime)}
            </span>
          </div>
        </div>
      </div>

      {/* 최소 인원 */}
      <div className="card">
        <div className="card-label">최소 인원</div>
        <div className="participant-row">
          <span className="participant-desc">출발에 필요한 최소 인원</span>
          <div className="participant-control">
            <button
              onClick={() => handleMinCapacityChange(-1)}
              disabled={minCapacity <= 2}
            >
              -
            </button>
            <span>{minCapacity}</span>
            <button
              onClick={() => handleMinCapacityChange(1)}
              disabled={minCapacity >= 4}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 알림 */}
      <div className="card notify-toggle-card">
        <div className="notify-toggle-row">
          <div className="notify-toggle-info">
            <span className="notify-toggle-label">팟 알림 받기</span>
            <span className="notify-toggle-sub">
              사람이 들어오거나 채팅이 오면 알림
            </span>
          </div>
          <button
            type="button"
            className={`cr-toggle ${notifyEnabled ? 'on' : 'off'}`}
            onClick={async () => {
              if (!notifyEnabled) {
                if (notifyPermission === 'denied') {
                  alert(
                    '알림이 차단되어 있습니다.\n주소창 왼쪽 🔒 아이콘 → 알림 → 허용 후 새로고침해주세요.'
                  );
                  return;
                }
                const granted = await requestNotificationPermission();
                setNotifyPermission(
                  'Notification' in window ? Notification.permission : 'denied'
                );
                if (granted) setNotifyEnabled(true);
              } else {
                setNotifyEnabled(false);
              }
            }}
            aria-label="알림 토글"
          >
            <span className="cr-toggle-thumb" />
          </button>
        </div>
      </div>

      <button className="create-button" onClick={handleCreateRoom}>
        택시팟 만들기
      </button>
    </div>
  );
};

export default CreateRoom;
