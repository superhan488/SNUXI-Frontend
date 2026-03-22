import { useAtom } from 'jotai';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { FaBars, FaBell } from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Message } from '../../api/room';
import {
  type Participant,
  getCurrentPot,
  getKakaoDeepLink,
  getMessages,
  getRoomParticipants,
  kickUserFromRoom,
  markAsRead,
  reportMessage,
  updateRoomStatus,
} from '../../api/room';
import { createStompClient } from '../../api/websocket';
import { isLoggedInAtom, userIdAtom } from '../../common/user';
import './ChatRoom.css';
import type { Client } from '@stomp/stompjs';

const ChatRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [readStatuses, setReadStatuses] = useState<Record<number, number>>({});
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [lastReadMessageIdOnEntry, setLastReadMessageIdOnEntry] = useState<
    number | null
  >(null);
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [userId] = useAtom(userIdAtom);
  const [newMessage, setNewMessage] = useState('');
  const [roomOwnerId, setRoomOwnerId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTaxiLinkModal, setShowTaxiLinkModal] = useState(false);
  const [taxiLink, setTaxiLink] = useState<string | null>(null);
  const [showKickUserModal, setShowKickUserModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // 모집 상태 관리
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // 신고하기 모달 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [targetMessageForReport, setTargetMessageForReport] =
    useState<Message | null>(null);
  const [reportReason, setReportReason] = useState('ABUSE');

  // Refs
  const clientRef = useRef<Client | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const needsInitialScroll = useRef(true);
  const msgHistoryTick = useRef(false);
  const isInitialLoadComplete = useRef(false);
  const isAtBottomRef = useRef(true);
  const lastMessageIdRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const initialUnreadCount =
    (location.state as { unreadCount?: number })?.unreadCount || 0;
  // [추가] 봇 메시지 포함 전체 안 읽은 수 가져오기
  const initialTotalUnreadCount =
    (location.state as { totalUnreadCount?: number })?.totalUnreadCount || 0;

  const totalMembers =
    (location.state as { totalMembers?: number })?.totalMembers || 2;

  // Fetch Owner & Current Status
  useEffect(() => {
    if (isLoggedIn && roomId) {
      const fetchOwnerAndStatus = async () => {
        try {
          const pot = await getCurrentPot();
          if (pot && pot.id === parseInt(roomId, 10)) {
            setRoomOwnerId(pot.ownerId);
            setIsLocked(pot.isLocked);
          }
        } catch (error) {
          console.error('Error fetching current pot:', error);
        }
      };
      fetchOwnerAndStatus();
    }
  }, [isLoggedIn, roomId]);

  const isOwner = userId === roomOwnerId;

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (
        !(event.target as HTMLElement).closest('.message-bubble') &&
        !(event.target as HTMLElement).closest('.report-button')
      ) {
        setSelectedMessageId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effects
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // 메시지 클릭 핸들러 (봇(ID:7) 및 내 메시지 클릭 무시)
  const handleMessageClick = (msg: Message) => {
    if (msg.senderId === 7 || msg.senderId === userId) return;

    if (selectedMessageId === msg.id) {
      setSelectedMessageId(null);
    } else {
      setSelectedMessageId(msg.id);
    }
  };

  // 신고 버튼 클릭 시 모달 열기
  const handleOpenReportModal = (messageToReport: Message) => {
    if (messageToReport.senderId === userId) {
      alert('자신의 메시지는 신고할 수 없습니다.');
      return;
    }
    setTargetMessageForReport(messageToReport);
    setReportReason('ABUSE');
    setShowReportModal(true);
    setSelectedMessageId(null);
  };

  // 실제 신고 API 호출
  const handleSubmitReport = async () => {
    if (!targetMessageForReport || !roomId) return;

    try {
      await reportMessage(parseInt(roomId, 10), {
        reason: reportReason,
        targetMessageId: targetMessageForReport.id,
        reportedUserId: targetMessageForReport.senderId,
      });
      alert('메시지가 성공적으로 신고되었습니다.');
      setShowReportModal(false);
      setTargetMessageForReport(null);
    } catch (error) {
      console.error('메시지 신고 실패:', error);
      alert('메시지 신고에 실패했습니다.');
    }
  };

  const handleOpenStatusModal = () => {
    setShowStatusModal(true);
    setShowMenu(false);
  };

  const handleToggleStatus = async () => {
    if (!roomId) return;
    try {
      const newStatus = !isLocked;
      await updateRoomStatus(parseInt(roomId, 10), newStatus);
      setIsLocked(newStatus);
      alert(
        `모집 상태가 ${newStatus ? '모집중지' : '모집중'}으로 변경되었습니다.`
      );
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating room status:', error);
      alert('모집 상태 변경에 실패했습니다.');
    }
  };

  const handleGetTaxiLink = async () => {
    if (!roomId) return;
    try {
      const link = await getKakaoDeepLink(parseInt(roomId, 10));
      setTaxiLink(link);
      setShowTaxiLinkModal(true);
    } catch (error) {
      console.error('Error getting Kakao Deep Link:', error);
      alert('카카오택시 링크를 가져오는데 실패했습니다.');
    } finally {
      setShowMenu(false);
    }
  };

  const handleKickUser = async () => {
    if (!roomId) return;
    try {
      const allParticipants = await getRoomParticipants(parseInt(roomId, 10));
      const kickableParticipants = allParticipants.filter(
        (p) => p.userId !== userId
      );
      setParticipants(kickableParticipants);
      setShowKickUserModal(true);
    } catch (error) {
      console.error('Error fetching participants:', error);
      alert('참가자 목록을 불러오는데 실패했습니다.');
    } finally {
      setShowMenu(false);
    }
  };

  const handleConfirmKick = async (username: string, userId: number) => {
    if (!roomId) return;
    if (window.confirm(`${username} 님을 강퇴하시겠습니까?`)) {
      try {
        await kickUserFromRoom(parseInt(roomId, 10), userId);
        alert(`${username} 님이 강퇴되었습니다.`);
      } catch (error) {
        console.error('Error kicking user:', error);
        alert('사용자 강퇴에 실패했습니다.');
      } finally {
        setShowKickUserModal(false);
      }
    }
  };

  const getUnreadCountForMessage = (msg: Message) => {
    const explicitReadersCount = Object.values(readStatuses).filter(
      (lastReadId) => lastReadId >= msg.id
    ).length;

    const senderLastRead = readStatuses[msg.senderId];
    const isSenderAlreadyCounted =
      senderLastRead !== undefined && senderLastRead >= msg.id;

    let finalReadCount = explicitReadersCount;
    if (!isSenderAlreadyCounted) {
      finalReadCount += 1;
    }

    return Math.max(0, totalMembers - finalReadCount);
  };

  useEffect(() => {
    if (isLoggedIn && roomId && userId) {
      const fetchInitial = async () => {
        setLoading(true);
        try {
          // [수정] 봇 메시지 포함된 전체 안 읽은 개수를 기준으로 불러올 개수 설정
          const unreadBase =
            initialTotalUnreadCount > 0
              ? initialTotalUnreadCount
              : initialUnreadCount;
          const targetCount = Math.max(40, unreadBase + 5);

          let collectedMessages: Message[] = [];
          let currentCursor: number | null = null;
          let keepFetching = true;
          let finalNextCursor: number | null = null;
          let finalHasNext = false;
          let finalReadStatuses: Record<number, number> = {};

          let initialUserReadId: number | null = null;

          while (keepFetching && collectedMessages.length < targetCount) {
            const remaining = targetCount - collectedMessages.length;
            const fetchSize = Math.min(100, remaining);
            const res = await getMessages(
              parseInt(roomId, 10),
              currentCursor,
              fetchSize
            );

            if (initialUserReadId === null && res.readStatuses && userId) {
              initialUserReadId = res.readStatuses[userId] || 0;
            }

            collectedMessages = [...collectedMessages, ...res.items];
            finalReadStatuses = { ...finalReadStatuses, ...res.readStatuses };
            currentCursor = res.nextCursor;
            finalNextCursor = res.nextCursor;
            finalHasNext = res.hasNext;
            if (!res.hasNext) {
              keepFetching = false;
            }
          }

          const sortedItems = [...collectedMessages].reverse();
          setMessages(sortedItems);
          setCursor(finalNextCursor);
          setHasNext(finalHasNext);
          setReadStatuses(finalReadStatuses);

          if (sortedItems.length > 0) {
            lastMessageIdRef.current = sortedItems[sortedItems.length - 1].id;
          }

          if (!isInitialLoadComplete.current) {
            const myLastReadId =
              initialUserReadId !== null
                ? initialUserReadId
                : finalReadStatuses[userId] || 0;

            const lastMessageId =
              sortedItems.length > 0
                ? sortedItems[sortedItems.length - 1].id
                : 0;

            if (myLastReadId >= lastMessageId) {
              setLastReadMessageIdOnEntry(null);
            } else {
              setLastReadMessageIdOnEntry(myLastReadId);
            }
            isInitialLoadComplete.current = true;
          }

          if (sortedItems.length > 0) {
            markAsRead(
              parseInt(roomId, 10),
              sortedItems[sortedItems.length - 1].id
            );
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitial();
    }
  }, [
    isLoggedIn,
    roomId,
    userId,
    initialUnreadCount,
    initialTotalUnreadCount, // 의존성 추가
  ]);

  useLayoutEffect(() => {
    if (
      messages.length > 0 &&
      !loading &&
      needsInitialScroll.current &&
      scrollContainerRef.current
    ) {
      const container = scrollContainerRef.current;
      const markerElement = container.querySelector('.unread-marker');
      if (markerElement) {
        markerElement.scrollIntoView({ block: 'center' });
        isAtBottomRef.current = false;
      } else {
        container.scrollTop = container.scrollHeight;
        isAtBottomRef.current = true;
      }
      needsInitialScroll.current = false;
      setIsReady(true);
    } else if (!loading && messages.length === 0) {
      setIsReady(true);
    }
  }, [loading, messages]);

  const fetchMoreMessages = useCallback(async () => {
    if (!roomId || !hasNext || fetchingMore || loading) return;
    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.style.overflowY = 'hidden';
    }
    setFetchingMore(true);
    try {
      const {
        items,
        nextCursor,
        hasNext: newHasNext,
        readStatuses: newReadStatuses,
      } = await getMessages(parseInt(roomId, 10), cursor, 40);
      const sortedOlderItems = [...items].reverse();
      msgHistoryTick.current = true;
      setMessages((prev) => [...sortedOlderItems, ...prev]);
      setCursor(nextCursor);
      setHasNext(newHasNext);
      setReadStatuses((prev) => ({ ...prev, ...newReadStatuses }));
    } catch (error) {
      console.error('Error fetching more messages:', error);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.overflowY = 'auto';
      }
      setFetchingMore(false);
    }
  }, [roomId, hasNext, cursor, fetchingMore, loading]);

  useLayoutEffect(() => {
    if (
      messages.length > 0 &&
      scrollContainerRef.current &&
      msgHistoryTick.current
    ) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      if (diff > 0) {
        container.scrollTop = diff;
      }
      container.style.overflowY = 'auto';
      setFetchingMore(false);
      msgHistoryTick.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (
      isReady &&
      !fetchingMore &&
      messages.length > 0 &&
      scrollContainerRef.current
    ) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.id !== lastMessageIdRef.current) {
        const isMyMessage = lastMsg.senderId === userId;
        const wasAtBottom = isAtBottomRef.current;
        if (isMyMessage || wasAtBottom) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
          setShowNewMessageAlert(false);
          isAtBottomRef.current = true;
        } else {
          setShowNewMessageAlert(true);
        }
        lastMessageIdRef.current = lastMsg.id;
      }
    }
  }, [messages, isReady, fetchingMore, userId]);

  const handleScroll = () => {
    setSelectedMessageId(null);

    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      if (scrollTop === 0 && hasNext && !fetchingMore && isReady) {
        fetchMoreMessages();
      }
      const isBottom = scrollHeight - scrollTop - clientHeight < 150;
      isAtBottomRef.current = isBottom;
      if (isBottom) {
        setShowNewMessageAlert(false);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
      setShowNewMessageAlert(false);
      isAtBottomRef.current = true;
    }
  };

  useEffect(() => {
    if (!roomId || !isLoggedIn) return;
    const client = createStompClient();
    clientRef.current = client;
    client.onConnect = () => {
      client.subscribe(`/sub/rooms/${roomId}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        markAsRead(parseInt(roomId, 10), receivedMessage.id);
      });
      client.subscribe(`/sub/rooms/${roomId}/read`, (message) => {
        const { userId: readUserId, lastReadMessageId } = JSON.parse(
          message.body
        );
        setReadStatuses((prev) => ({
          ...prev,
          [readUserId]: lastReadMessageId,
        }));
      });
    };
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [roomId, isLoggedIn]);

  const sendMessage = () => {
    if (clientRef.current && newMessage.trim() !== '' && roomId) {
      const messageToSend = { text: newMessage };
      clientRef.current.publish({
        destination: `/pub/rooms/${roomId}/messages`,
        body: JSON.stringify(messageToSend),
      });
      setNewMessage('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  if (!isReady) {
    return (
      <div className="chat-room-container loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="chat-room-container">
      {isOwner && (
        <div className="menu-container" ref={menuRef}>
          <button
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <FaBars />
          </button>
          {showMenu && (
            <div className="menu-dropdown">
              <button onClick={handleOpenStatusModal}>모집 상태 변경</button>
              <button onClick={handleGetTaxiLink}>택시 호출 링크</button>
              <button onClick={handleKickUser}>사용자 강퇴</button>
            </div>
          )}
        </div>
      )}

      <div
        className="messages-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {fetchingMore && (
          <div className="loading-indicator">
            <div className="spinner"></div>
          </div>
        )}
        {messages.map((msg, index) => {
          const isMyMessage = msg.senderId === userId;
          const isBotMessage = msg.senderId === 7;

          const currentDate = formatDate(msg.datetimeSendAt);
          const prevDate =
            index > 0 ? formatDate(messages[index - 1].datetimeSendAt) : null;
          const showDateSeparator = currentDate !== prevDate;

          let showUnreadMarker = false;
          if (lastReadMessageIdOnEntry !== null) {
            const prevMsgId = index > 0 ? messages[index - 1].id : 0;
            if (prevMsgId === lastReadMessageIdOnEntry) {
              showUnreadMarker = true;
            }
            if (index === 0 && msg.id > lastReadMessageIdOnEntry) {
              showUnreadMarker = true;
            }
          }

          const unreadCount = getUnreadCountForMessage(msg);
          const isSelected = selectedMessageId === msg.id;

          return (
            <div key={msg.id || `msg-${index}`}>
              {showDateSeparator && (
                <div className="date-separator">
                  <span>{currentDate}</span>
                </div>
              )}

              {showUnreadMarker && (
                <div className="unread-marker">
                  <span>여기까지 읽으셨습니다</span>
                </div>
              )}

              <div
                className={`message-bubble ${
                  isMyMessage
                    ? 'my-message'
                    : isBotMessage
                      ? 'bot-message'
                      : 'other-message'
                }`}
              >
                {!isMyMessage && !isBotMessage && (
                  <div className="profile-column">
                    <img
                      src={
                        msg.senderProfileImageUrl ||
                        'https://via.placeholder.com/40'
                      }
                      alt={msg.senderUsername}
                      className="profile-picture"
                    />
                  </div>
                )}

                <div className="message-content-wrapper">
                  {!isMyMessage && !isBotMessage && (
                    <span className="sender-username">
                      {msg.senderUsername}
                    </span>
                  )}

                  <div className="message-row">
                    {isMyMessage && (
                      <div className="message-meta">
                        {unreadCount > 0 && (
                          <span className="unread-count">{unreadCount}</span>
                        )}
                        <span className="message-time">
                          {new Date(msg.datetimeSendAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    <div
                      className={`message-content ${isSelected ? 'clicked' : ''}`}
                      onClick={() => handleMessageClick(msg)}
                    >
                      <p className="message-text">{msg.text}</p>
                    </div>
                    {!isMyMessage && !isBotMessage && (
                      <div className="message-meta">
                        <div className="message-meta-top-row">
                          {unreadCount > 0 && (
                            <span className="unread-count">{unreadCount}</span>
                          )}
                          {isSelected && (
                            <button
                              className="report-button"
                              onClick={() => handleOpenReportModal(msg)}
                            >
                              <FaBell size={12} />
                            </button>
                          )}
                        </div>
                        <span className="message-time">
                          {new Date(msg.datetimeSendAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNewMessageAlert && (
        <div className="new-message-alert" onClick={scrollToBottom}>
          ⬇ 새로운 메시지
        </div>
      )}

      <div className="message-input-container">
        <input
          type="text"
          placeholder="메시지 보내기"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="send-button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
              fill="white"
            />
          </svg>
        </button>
      </div>

      {/* 모집 상태 변경 모달 */}
      {showStatusModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowStatusModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>모집 상태 변경</h3>
            <p>
              현재 상태: <strong>{isLocked ? '모집중지' : '모집중'}</strong>
            </p>
            <p>
              상태를 <strong>{isLocked ? '모집중' : '모집중지'}</strong>으로
              변경하시겠습니까?
            </p>
            <div className="modal-actions">
              <button
                className="action-button primary"
                onClick={handleToggleStatus}
              >
                변경하기
              </button>
              <button
                className="action-button secondary"
                onClick={() => setShowStatusModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카카오택시 링크 모달 */}
      {showTaxiLinkModal && taxiLink && (
        <div
          className="modal-overlay"
          onClick={() => setShowTaxiLinkModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>카카오택시 링크</h3>
            <p>아래 버튼을 눌러 카카오택시를 호출하세요:</p>
            <a
              href={taxiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="kakao-link-button"
            >
              카카오택시 호출하기
            </a>
            <button
              className="close-button"
              onClick={() => setShowTaxiLinkModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showKickUserModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowKickUserModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>사용자 강퇴</h3>
            <div className="participant-list">
              {participants.length > 0 ? (
                participants.map((p) => (
                  <div key={p.userId} className="participant-item">
                    <img
                      src={
                        p.profileImageUrl || 'https://via.placeholder.com/30'
                      }
                      alt={p.username}
                      className="participant-profile-pic"
                    />
                    <span>{p.username}</span>
                    <button
                      className="kick-button"
                      onClick={() => handleConfirmKick(p.username, p.userId)}
                    >
                      강퇴
                    </button>
                  </div>
                ))
              ) : (
                <p>강퇴할 사용자가 없습니다.</p>
              )}
            </div>
            <button
              className="close-button"
              onClick={() => setShowKickUserModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 신고하기 모달 */}
      {showReportModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowReportModal(false);
            setTargetMessageForReport(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>신고하기</h3>
            <div className="report-list">
              <label className="report-item">
                <input
                  type="radio"
                  name="reportReason"
                  value="ABUSE"
                  checked={reportReason === 'ABUSE'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                욕설/비하 발언
              </label>
              <label className="report-item">
                <input
                  type="radio"
                  name="reportReason"
                  value="SPAM"
                  checked={reportReason === 'SPAM'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                스팸/부적절한 홍보
              </label>
              <label className="report-item">
                <input
                  type="radio"
                  name="reportReason"
                  value="OTHER"
                  checked={reportReason === 'OTHER'}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                기타 사유
              </label>
            </div>
            <div className="modal-actions">
              <button
                className="action-button danger"
                onClick={handleSubmitReport}
              >
                메세지 신고하기
              </button>
              <button
                className="action-button secondary"
                onClick={() => {
                  setShowReportModal(false);
                  setTargetMessageForReport(null);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
