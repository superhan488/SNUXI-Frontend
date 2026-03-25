import { AxiosError } from 'axios';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../api/constants';
import apiClient from '../../api/index';
import { getLandmarks } from '../../api/map';
import { getUserPots } from '../../api/room';
import { isLoggedInAtom } from '../../common/user';
import BellToggle from '../../components/BellToggle';
import { type RoomData } from '../../types';
import RoomCard from './RoomCard';
import './RoomSearch.css';

// 랜드마크 타입 정의
interface Landmark {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

// 서버 API 응답 데이터(PotDto)
interface PotDto {
  id: number;
  ownerId: number;
  ownerName: string;
  departureId: number;
  destinationId: number;
  departureTime: string;
  minCapacity: number;
  maxCapacity: number;
  currentCount: number;
  estimatedFee: number;
  status: string;
}

const RoomSearch = () => {
  const navigate = useNavigate();
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  // --- 상태 관리 ---
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [landmarksLoaded, setLandmarksLoaded] = useState(false);

  const [departureId, setDepartureId] = useState<number>(0);
  const [destinationId, setDestinationId] = useState<number>(0);

  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [myPotIds, setMyPotIds] = useState<Set<number>>(new Set());

  // --- 모달 상태 ---
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // --- Refs ---
  const loadingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 0. 내 팟 IDs 가져오기
  useEffect(() => {
    if (!isLoggedIn) return;
    getUserPots()
      .then((pots) => setMyPotIds(new Set(pots.map((p) => p.id))))
      .catch(() => setMyPotIds(new Set()));
  }, [isLoggedIn]);

  // 1. 랜드마크 데이터 불러오기
  useEffect(() => {
    const fetchLandmarksData = async () => {
      try {
        const data = await getLandmarks();
        if (data && data.landmarks) {
          setLandmarks(data.landmarks);
          setLandmarksLoaded(true);
        }
      } catch (error) {
        console.error('랜드마크 정보를 불러오지 못했습니다:', error);
        setLandmarksLoaded(true);
      }
    };
    fetchLandmarksData();
  }, []);

  const getLandmarkName = useCallback(
    (id: number) => {
      return landmarks.find((l) => l.id === id)?.name || '알 수 없음';
    },
    [landmarks]
  );

  // 2. 방 목록 조회
  const fetchRooms = useCallback(
    async (pageNumber: number, isNewSearch: boolean) => {
      if (!landmarksLoaded) return;
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const params = {
          departureId: departureId === 0 ? null : departureId,
          destinationId: destinationId === 0 ? null : destinationId,
          page: pageNumber,
          size: 10,
          sort: 'departureTime,asc',
        };

        const response = await apiClient.get('/rooms/search', { params });
        const content = response.data.content || [];

        const newRooms: RoomData[] = content.map((item: PotDto) => ({
          roomId: item.id,
          departure: getLandmarkName(item.departureId),
          destination: getLandmarkName(item.destinationId),
          departureTime: item.departureTime,
          minCapacity: item.minCapacity,
          maxCapacity: item.maxCapacity,
          currentCapacity: item.currentCount,
          hostName: item.ownerName,
          estimatedFee: item.estimatedFee,
          status: item.status,
        }));

        const isLast = response.data.last ?? newRooms.length === 0;

        if (isNewSearch) {
          setRooms(newRooms);
        } else {
          setRooms((prev) => {
            const existingIds = new Set(prev.map((r) => r.roomId));
            const uniqueRooms = newRooms.filter(
              (r) => !existingIds.has(r.roomId)
            );
            return [...prev, ...uniqueRooms];
          });
        }

        setHasMore(!isLast);
      } catch (error) {
        console.error('방 목록 불러오기 실패:', error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [departureId, destinationId, getLandmarkName, landmarksLoaded]
  );

  // 필터 변경 시 초기화
  useEffect(() => {
    if (!landmarksLoaded) return;
    setPage(0);
    setHasMore(true);
    fetchRooms(0, true);
  }, [fetchRooms, landmarksLoaded]);

  // 페이지 변경(스크롤) 시 추가 로딩
  useEffect(() => {
    if (!landmarksLoaded) return;
    if (page > 0) {
      fetchRooms(page, false);
    }
  }, [page, fetchRooms, landmarksLoaded]);

  // 무한 스크롤 옵저버
  useEffect(() => {
    if (loading || !hasMore || !landmarksLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    observerRef.current = observer;

    return () => {
      if (observerRef.current) observer.disconnect();
    };
  }, [loading, hasMore, landmarksLoaded]);

  // --- Handlers ---
  const handleRoomClick = (roomId: number) => {
    setSelectedRoomId(roomId);
    if (isLoggedIn) {
      setShowJoinModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginConfirm = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    const googleLoginUrl = `${BACKEND_URL}/login?redirect_uri=${encodedUri}`;
    window.location.href = googleLoginUrl;
  };

  const handleJoinConfirm = async () => {
    if (!selectedRoomId) return;
    if (myPotIds.size >= 3) {
      alert('최대 3개 방을 참여할 수 있습니다.');
      setShowJoinModal(false);
      return;
    }
    try {
      await apiClient.post(`/rooms/${selectedRoomId}/join`);
      navigate('/my-chat');
    } catch (error) {
      const axiosError = error as AxiosError<{ errMsg: string }>;
      const errMsg =
        axiosError.response?.data?.errMsg || '참여에 실패했습니다.';
      alert(errMsg);
      setShowJoinModal(false);
    }
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowJoinModal(false);
    setSelectedRoomId(null);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setter(Number(e.target.value));
  };

  if (!landmarksLoaded) {
    return (
      <div className="search-container loading-container">
        <div className="loading-text">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="search-container">
      {/* 모바일 앱바 */}
      <div className="mobile-app-bar">
        <Link to="/" className="app-bar-logo">
          SNUXI
        </Link>
        <BellToggle className="app-bar-bell" />
      </div>

      <div className="sticky-header">
        <div className="search-filter-card">
          <div className="filter-row">
            <select
              value={departureId}
              onChange={(e) => handleFilterChange(e, setDepartureId)}
            >
              <option value={0}>출발지 전체</option>
              {landmarks.map((place) => (
                <option key={`start-${place.id}`} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
            <span className="arrow">→</span>
            <select
              value={destinationId}
              onChange={(e) => handleFilterChange(e, setDestinationId)}
            >
              <option value={0}>도착지 전체</option>
              {landmarks.map((place) => (
                <option key={`end-${place.id}`} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="room-list-scroll">
        <div className="section-header">
          <span className="section-title">지금 모집중</span>
        </div>
        {rooms.length > 0
          ? rooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                onClick={handleRoomClick}
                isMyPot={myPotIds.has(room.roomId)}
              />
            ))
          : !loading && (
              <div className="no-result">
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
                  <path d="M5 11l1.5-4.5h11L19 11" />
                  <rect x="2" y="11" width="20" height="7" rx="2" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                  <path d="M2 15h20" />
                </svg>
                조건에 맞는 방이 없습니다.
              </div>
            )}

        {hasMore && (
          <div ref={loadMoreRef} className="loading-sentinel">
            {loading ? '로딩 중...' : ''}
          </div>
        )}
      </div>

      {(showLoginModal || showJoinModal) && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {showLoginModal && (
              <>
                <p>택시팟에 참여하시려면 로그인이 필요합니다.</p>
                <div style={buttonGroupStyle}>
                  <button onClick={closeModals} style={cancelButtonStyle}>
                    뒤로가기
                  </button>
                  <button
                    onClick={handleLoginConfirm}
                    style={confirmButtonStyle}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = '#0056b3')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = '#007bff')
                    }
                  >
                    로그인
                  </button>
                </div>
              </>
            )}
            {showJoinModal && (
              <>
                <p>택시팟에 참여하시겠습니까?</p>
                <div style={buttonGroupStyle}>
                  <button onClick={closeModals} style={cancelButtonStyle}>
                    뒤로가기
                  </button>
                  <button
                    onClick={handleJoinConfirm}
                    style={confirmButtonStyle}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = '#0056b3')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = '#007bff')
                    }
                  >
                    참여하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 스타일 객체 ---
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(30, 27, 75, 0.45)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '28px',
  borderRadius: '20px',
  width: '80%',
  maxWidth: '300px',
  textAlign: 'center',
  boxShadow: '0 8px 32px rgba(79, 70, 229, 0.16)',
  border: '1.5px solid #e8e5ff',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '20px',
  gap: '8px',
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '11px',
  borderRadius: '8px',
  border: '1.5px solid #e8e5ff',
  backgroundColor: '#f5f3ff',
  cursor: 'pointer',
  fontWeight: '600',
  color: '#64748b',
};

const confirmButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '11px',
  borderRadius: '8px',
  border: 'none',
  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  color: 'white',
  cursor: 'pointer',
  fontWeight: '700',
  boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
};

export default RoomSearch;
