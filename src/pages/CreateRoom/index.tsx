import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLandmarks } from '../../api/map';
import { createRoom } from '../../api/room';
import { isLoggedInAtom } from '../../common/user';
import './CreateRoom.css';

// 랜드마크 타입 정의
interface Landmark {
  id: number;
  name: string;
}

const CreateRoom = () => {
  const navigate = useNavigate();
  const [isLoggedIn] = useAtom(isLoggedInAtom);

  // 날짜 input 제어를 위한 ref 생성
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 상태 관리
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [minCapacity, setMinCapacity] = useState(2);

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

  const handleMinCapacityChange = (amount: number) => {
    setMinCapacity((prev) => {
      const newValue = prev + amount;
      if (newValue >= 2 && newValue <= 4) {
        return newValue;
      }
      return prev;
    });
  };

  const handleCreateRoom = async () => {
    if (!start || !end || !departureTime || !minCapacity) {
      alert('모든 필드를 채워주세요.');
      return;
    }

    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    if (start === end) {
      alert('출발지와 도착지를 다르게 입력해주세요.');
      return;
    }

    const departureId = parseInt(start, 10);
    const destinationId = parseInt(end, 10);

    // UTC 변환 없이 사용자가 선택한 한국 시간 그대로 전송 ('YYYY-MM-DDTHH:mm:00')
    const departureTimeISO = `${departureTime}:00`;

    const roomDetails = {
      departureId,
      destinationId,
      departureTime: departureTimeISO,
      minCapacity,
      maxCapacity: 4,
      estimatedFee: 0,
    };

    try {
      await createRoom(roomDetails);
      // [수정] 방 ID 출력 제거
      alert('방이 성공적으로 개설되었습니다!');
      navigate('/search-room');
    } catch (error: unknown) {
      let errorMsg = '방 개설 중 오류가 발생했습니다.';
      if (isAxiosError(error) && error.response?.data) {
        // biome-ignore lint/suspicious/noExplicitAny: 서버 에러 구조 대응
        const data = error.response.data as any;
        errorMsg = data.errMsg || data.message || errorMsg;
      }
      alert(errorMsg);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '날짜와 시간을 선택해주세요';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // 박스 클릭 시 실행될 함수
  const handleDateBoxClick = () => {
    if (dateInputRef.current) {
      try {
        // 브라우저의 날짜 선택 팝업을 강제로 띄움
        dateInputRef.current.showPicker();
      } catch (_error) {
        // showPicker를 지원하지 않는 구형 브라우저 대비
        dateInputRef.current.focus();
      }
    }
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
      <h1>택시팟 만들기</h1>

      <div className="card location-box">
        <div className="location-select">
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            <option value="">출발지</option>
            {landmarks.map((landmark) => (
              <option key={`start-${landmark.id}`} value={landmark.id}>
                {landmark.name}
              </option>
            ))}
          </select>
        </div>
        <div className="arrow">→</div>
        <div className="location-select">
          <select value={end} onChange={(e) => setEnd(e.target.value)}>
            <option value="">도착지</option>
            {landmarks.map((landmark) => (
              <option key={`end-${landmark.id}`} value={landmark.id}>
                {landmark.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="input-group">
          <label>출발 날짜 및 시간</label>

          {/* onClick 이벤트 연결 */}
          <div
            className="custom-date-input-wrapper"
            onClick={handleDateBoxClick}
          >
            {/* ref 연결 */}
            <input
              ref={dateInputRef}
              type="datetime-local"
              className="hidden-date-input"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              step="60"
            />
            <div
              className={`date-display-box ${departureTime ? 'active' : ''}`}
            >
              <span className="calendar-icon">📅</span>
              <span className="date-text">
                {formatDisplayDate(departureTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="input-group">
          <label>최소 인원</label>
          <div className="participant-control">
            <button
              onClick={() => handleMinCapacityChange(-1)}
              disabled={minCapacity <= 2}
            >
              -
            </button>
            <span>{minCapacity}명</span>
            <button
              onClick={() => handleMinCapacityChange(1)}
              disabled={minCapacity >= 4}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button className="create-button" onClick={handleCreateRoom}>
        택시팟 만들기
      </button>
    </div>
  );
};

export default CreateRoom;
