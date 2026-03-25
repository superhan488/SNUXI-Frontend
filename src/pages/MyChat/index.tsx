import { isAxiosError } from 'axios';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLandmarks } from '../../api/map';
import type { Participant, Pot } from '../../api/room';
import {
  deleteRoom,
  getKakaoDeepLink,
  getRoomParticipants,
  getUserPots,
  kickUserFromRoom,
  leaveRoom,
  updateRoomStatus,
} from '../../api/room';
import { userIdAtom } from '../../common/user';
import BellToggle from '../../components/BellToggle';
import './MyChat.css';

const MyChat = () => {
  const userId = useAtomValue(userIdAtom);
  const navigate = useNavigate();
  const [pots, setPots] = useState<Pot[]>([]);
  const [participantsMap, setParticipantsMap] = useState<
    Record<number, Participant[]>
  >({});
  const [landmarks, setLandmarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  // Active pot for modal actions
  const [activePot, setActivePot] = useState<Pot | null>(null);
  const [showSettings, setShowSettings] = useState<number | null>(null); // potId of open dropdown

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [kickableParticipants, setKickableParticipants] = useState<
    Participant[]
  >([]);
  const [showTaxiLinkModal, setShowTaxiLinkModal] = useState(false);
  const [taxiLink, setTaxiLink] = useState<string | null>(null);

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

  const fetchPots = useCallback(async () => {
    try {
      const fetched = await getUserPots();
      setPots([...fetched].sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()));
      const map: Record<number, Participant[]> = {};
      await Promise.all(
        fetched.map(async (pot) => {
          try {
            map[pot.id] = await getRoomParticipants(pot.id);
          } catch {
            map[pot.id] = [];
          }
        })
      );
      setParticipantsMap(map);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Error fetching pots:', error.response?.data);
      }
      setPots([]);
      setParticipantsMap({});
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLandmarksData(), fetchPots()]);
      setLoading(false);
    };
    init();
  }, [fetchLandmarksData, fetchPots]);

  const handleDelete = async (pot: Pot) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('팟을 삭제하시겠습니까? 모든 멤버가 퇴장됩니다.')) {
      try {
        await deleteRoom(pot.id);
        fetchPots();
      } catch (_error: unknown) {
        alert('팟 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleLeave = async (pot: Pot) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('팟에서 나가시겠습니까?')) {
      try {
        await leaveRoom(pot.id);
        fetchPots();
      } catch (_error: unknown) {
        alert('방에서 나가는 중 오류가 발생했습니다.');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!activePot) return;
    try {
      const newLocked = !activePot.isLocked;
      await updateRoomStatus(activePot.id, newLocked);
      setPots((prev) =>
        prev.map((p) =>
          p.id === activePot.id ? { ...p, isLocked: newLocked } : p
        )
      );
      setShowStatusModal(false);
    } catch (_e) {
      alert('모집 상태 변경에 실패했습니다.');
    }
  };

  const handleGetTaxiLink = async (pot: Pot) => {
    try {
      const link = await getKakaoDeepLink(pot.id);
      setTaxiLink(link);
      setShowTaxiLinkModal(true);
    } catch (error) {
      const axiosErr = error as import('axios').AxiosError<{ errMsg?: string }>;
      alert(
        axiosErr.response?.data?.errMsg ||
          '카카오택시 링크를 가져오는데 실패했습니다.'
      );
    }
  };

  const handleOpenKickModal = (pot: Pot) => {
    setActivePot(pot);
    setKickableParticipants(
      (participantsMap[pot.id] || []).filter((p) => p.userId !== userId)
    );
    setShowKickModal(true);
    setShowSettings(null);
  };

  const handleConfirmKick = async (username: string, targetId: number) => {
    if (!activePot) return;
    // eslint-disable-next-line no-restricted-globals
    if (confirm(`${username} 님을 강퇴하시겠습니까?`)) {
      try {
        await kickUserFromRoom(activePot.id, targetId);
        alert(`${username} 님이 강퇴되었습니다.`);
        setShowKickModal(false);
        fetchPots();
      } catch (_e) {
        alert('사용자 강퇴에 실패했습니다.');
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

  const renderStatusBadges = (pot: Pot) => {
    const { status, isLocked } = pot;
    const badges = [];
    if (status === 'RECRUITING' || status === 'SUCCESS') {
      badges.push(
        isLocked
          ? { text: '모집중지', type: 'locked' }
          : { text: '모집중', type: 'recruiting' }
      );
    }
    if (status === 'SUCCESS')
      badges.push({ text: '출발확정', type: 'success' });
    if (status !== 'RECRUITING' && status !== 'SUCCESS')
      badges.push({ text: '마감', type: 'closed' });
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
      <div className="mobile-app-bar">
        <Link to="/" className="app-bar-logo">
          SNUXI
        </Link>
        <BellToggle className="app-bar-bell" />
      </div>
      <div className="chat-page-content">
        {pots.length === 0 ? (
          <div className="no-pot-message">
            <svg
              width="52"
              height="52"
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
            현재 참여 중인 팟이 없습니다.
          </div>
        ) : (
          <div className="pot-card-wrapper">
            {pots.map((pot) => {
              const potParticipants = participantsMap[pot.id] || [];
              const isOwner = userId === pot.ownerId;
              return (
                <div key={pot.id} className="current-pot-card">
                  {/* Card top row */}
                  <div className="pot-card-top">
                    <div className="pot-route-row">
                      <span className="pot-loc">
                        {landmarks[pot.departureId] || '알 수 없음'}
                      </span>
                      <span className="pot-arrow-icon">→</span>
                      <span className="pot-loc">
                        {landmarks[pot.destinationId] || '알 수 없음'}
                      </span>
                    </div>
                    <div className="settings-wrapper">
                      <button
                        className="settings-btn"
                        onClick={() =>
                          setShowSettings((v) => (v === pot.id ? null : pot.id))
                        }
                      >
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
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                      </button>
                      {showSettings === pot.id && (
                        <div className="settings-dropdown">
                          {isOwner ? (
                            <>
                              <button
                                className="settings-item"
                                onClick={() => {
                                  setActivePot(pot);
                                  setShowStatusModal(true);
                                  setShowSettings(null);
                                }}
                              >
                                모집 상태 변경
                              </button>
                              <button
                                className="settings-item"
                                onClick={() => handleOpenKickModal(pot)}
                              >
                                멤버 강퇴
                              </button>
                              <button
                                className="settings-item danger"
                                onClick={() => {
                                  setShowSettings(null);
                                  handleDelete(pot);
                                }}
                              >
                                팟 삭제
                              </button>
                            </>
                          ) : (
                            <button
                              className="settings-item danger"
                              onClick={() => {
                                setShowSettings(null);
                                handleLeave(pot);
                              }}
                            >
                              팟 나가기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="pot-meta">
                    <span className="time">
                      {new Date(pot.departureTime).toLocaleString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {renderStatusBadges(pot)}
                    <span className="headcount-fixed">
                      {pot.currentCount}/{pot.maxCapacity}
                    </span>
                  </div>

                  {/* Participants */}
                  <div className="pot-participants">
                    <span className="participants-label">
                      참가자 {potParticipants.length}/{pot.maxCapacity}
                    </span>
                    <div className="participants-list">
                      {potParticipants.map((p) => (
                        <div key={p.userId} className="participant-row-item">
                          {p.profileImageUrl ? (
                            <img
                              src={p.profileImageUrl}
                              alt={p.username}
                              className="participant-avatar"
                            />
                          ) : (
                            <div className="participant-avatar placeholder">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                              </svg>
                            </div>
                          )}
                          <span className="participant-name">{p.username}</span>
                          {p.role === 'OWNER' && (
                            <span className="participant-owner-tag">방장</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <button
                    className="chat-enter-btn"
                    onClick={() =>
                      navigate(`/chat/${pot.id}`, {
                        state: {
                          unreadCount: pot.unreadCount,
                          totalUnreadCount: pot.totalUnreadCount,
                          totalMembers: pot.currentCount,
                          departure: landmarks[pot.departureId] || '출발지',
                          destination: landmarks[pot.destinationId] || '도착지',
                          departureTime: pot.departureTime,
                          currentCount: pot.currentCount,
                          maxCapacity: pot.maxCapacity,
                        },
                      })
                    }
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    채팅하기
                    {pot.unreadCount > 0 && (
                      <span className="chat-unread-badge">
                        {pot.unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    className="kakao-taxi-btn"
                    onClick={() => handleGetTaxiLink(pot)}
                  >
                    <svg
                      width="18"
                      height="18"
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
                    카카오택시로 호출하기
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 모집 상태 변경 모달 */}
      {showStatusModal && activePot && (
        <div
          className="mc-modal-overlay"
          onClick={() => setShowStatusModal(false)}
        >
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>모집 상태 변경</h3>
            <p>
              현재:{' '}
              <strong>{activePot.isLocked ? '모집중지' : '모집중'}</strong>
            </p>
            <p>
              <strong>{activePot.isLocked ? '모집중' : '모집중지'}</strong>으로
              변경하시겠습니까?
            </p>
            <div className="mc-modal-actions">
              <button
                className="mc-modal-btn primary"
                onClick={handleToggleStatus}
              >
                변경하기
              </button>
              <button
                className="mc-modal-btn secondary"
                onClick={() => setShowStatusModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멤버 강퇴 모달 */}
      {showKickModal && (
        <div
          className="mc-modal-overlay"
          onClick={() => setShowKickModal(false)}
        >
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>멤버 강퇴</h3>
            {kickableParticipants.length === 0 ? (
              <p>강퇴할 수 있는 멤버가 없습니다.</p>
            ) : (
              <div className="mc-kick-list">
                {kickableParticipants.map((p) => (
                  <div key={p.userId} className="mc-kick-item">
                    <span className="mc-kick-name">{p.username}</span>
                    <button
                      className="mc-kick-btn"
                      onClick={() => handleConfirmKick(p.username, p.userId)}
                    >
                      강퇴
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              className="mc-modal-btn secondary"
              onClick={() => setShowKickModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 택시 호출 링크 모달 */}
      {showTaxiLinkModal && taxiLink && (
        <div
          className="mc-modal-overlay"
          onClick={() => setShowTaxiLinkModal(false)}
        >
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>카카오택시 링크</h3>
            <p>아래 버튼을 눌러 카카오택시를 호출하세요:</p>
            <a
              href={taxiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-modal-btn primary"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              카카오택시 호출하기
            </a>
            <button
              className="mc-modal-btn secondary"
              onClick={() => setShowTaxiLinkModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyChat;
