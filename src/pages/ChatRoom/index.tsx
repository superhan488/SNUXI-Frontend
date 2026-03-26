import { useAtom } from 'jotai';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { FaBell } from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getLandmarks } from '../../api/map';
import type { Message } from '../../api/room';
import {
  getCurrentPot,
  getKakaoDeepLink,
  getMessages,
  markAsRead,
  reportMessage,
  trackKakaoDeepLink,
} from '../../api/room';
import { createStompClient } from '../../api/websocket';
import { isLoggedInAtom, userIdAtom } from '../../common/user';
import {
  getBotNotificationTitle,
  showNotification,
} from '../../utils/notifications';
import './ChatRoom.css';
import type { Client } from '@stomp/stompjs';

const maskName = (name: string) => {
  const parts = name.split(' / ');
  const chars = Array.from(parts[0].replace(/^[^가-힣a-zA-Z0-9]+/, ''));
  if (chars.length >= 2) {
    chars[1] = '*';
    parts[0] = chars.join('');
  } else {
    parts[0] = chars.join('');
  }
  return parts.join(' / ');
};

const maskBotMessage = (text: string) =>
  text.replace(/^(.+?)님이/, (_, name) => `${maskName(name)}님이`);

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
  const [routeInfo, setRouteInfo] = useState<{
    departure: string;
    destination: string;
    departureTime: string;
    currentCount: number;
    maxCapacity: number;
  } | null>(
    (() => {
      const s = location.state as Record<string, unknown> | null;
      if (s?.departure && s?.destination) {
        return {
          departure: s.departure as string,
          destination: s.destination as string,
          departureTime: s.departureTime as string,
          currentCount: (s.currentCount as number) ?? 0,
          maxCapacity: (s.maxCapacity as number) ?? 4,
        };
      }
      return null;
    })()
  );
  const [showTaxiLinkModal, setShowTaxiLinkModal] = useState(false);
  const [taxiLink, setTaxiLink] = useState<string | null>(null);

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

  const initialUnreadCount =
    (location.state as { unreadCount?: number })?.unreadCount || 0;
  // [추가] 봇 메시지 포함 전체 안 읽은 수 가져오기
  const initialTotalUnreadCount =
    (location.state as { totalUnreadCount?: number })?.totalUnreadCount || 0;

  const totalMembers =
    (location.state as { totalMembers?: number })?.totalMembers || 2;

  // Fetch route info if not passed via navigation state
  useEffect(() => {
    if (isLoggedIn && roomId && !routeInfo) {
      const fetchRouteInfo = async () => {
        try {
          const [pot, landmarksData] = await Promise.all([
            getCurrentPot(),
            getLandmarks(),
          ]);
          if (
            pot &&
            pot.id === parseInt(roomId, 10) &&
            landmarksData?.landmarks
          ) {
            const lmap: Record<number, string> = {};
            // biome-ignore lint/suspicious/noExplicitAny:
            landmarksData.landmarks.forEach((l: any) => {
              lmap[l.id] = l.name;
            });
            setRouteInfo({
              departure: lmap[pot.departureId] || '출발지',
              destination: lmap[pot.destinationId] || '도착지',
              departureTime: pot.departureTime,
              currentCount: pot.currentCount,
              maxCapacity: pot.maxCapacity,
            });
          }
        } catch (error) {
          console.error('Error fetching route info:', error);
        }
      };
      fetchRouteInfo();
    }
  }, [isLoggedIn, roomId, routeInfo]);

  // 메시지 외부 클릭 시 선택 해제
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !(event.target as HTMLElement).closest('.message-bubble') &&
        !(event.target as HTMLElement).closest('.report-button')
      ) {
        setSelectedMessageId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleGetTaxiLink = async () => {
    if (!roomId) return;
    const id = parseInt(roomId, 10);
    try {
      const link = await getKakaoDeepLink(id);
      setTaxiLink(link);
      setShowTaxiLinkModal(true);
      // 링크 실행 시도 후 track
      try {
        window.location.href = link;
        await trackKakaoDeepLink(id, true);
      } catch {
        await trackKakaoDeepLink(id, false, '링크 실행 실패');
      }
    } catch (error) {
      console.error('Error getting Kakao Deep Link:', error);
      const axiosErr = error as import('axios').AxiosError<{
        errMsg?: string;
        message?: string;
      }>;
      const msg =
        axiosErr.response?.data?.errMsg ||
        axiosErr.response?.data?.message ||
        '카카오택시 링크를 가져오는데 실패했습니다.';
      await trackKakaoDeepLink(id, false, msg).catch((_e) => _e);
      alert(msg);
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
          // Inject current user's effective read so own messages don't appear unread
          const effectiveReadStatuses = { ...finalReadStatuses };
          if (userId && sortedItems.length > 0) {
            effectiveReadStatuses[userId] =
              sortedItems[sortedItems.length - 1].id;
          }
          setReadStatuses(effectiveReadStatuses);

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
        if (userId) {
          setReadStatuses((prev) => ({
            ...prev,
            [userId]: receivedMessage.id,
          }));
        }

        // 탭이 백그라운드 상태일 때 알림 표시 (내 메시지 제외)
        if (document.hidden) {
          const isBotMessage = receivedMessage.senderId === 7;
          const msgText = receivedMessage.text || '';
          if (isBotMessage) {
            const title = getBotNotificationTitle(msgText);
            showNotification(title, msgText, `/chat/${roomId}`);
          } else {
            const sender = maskName(receivedMessage.senderUsername || '누군가');
            showNotification(
              `${sender}님의 메시지`,
              msgText,
              `/chat/${roomId}`
            );
          }
        }
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
  }, [roomId, isLoggedIn, userId]);

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

  const routeDeparture = routeInfo?.departure ?? '';
  const routeDestination = routeInfo?.destination ?? '';
  const routeDepartureTime = routeInfo?.departureTime ?? '';
  const routeCurrentCount = routeInfo?.currentCount ?? 0;
  const routeMaxCapacity = routeInfo?.maxCapacity ?? 4;

  const chatTimeLabel = (() => {
    if (!routeDepartureTime) return '';
    const d = new Date(routeDepartureTime);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return isToday
      ? `오늘 ${time}`
      : `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  })();

  return (
    <div className="chat-room-container">
      {/* 채팅방 헤더 */}
      <div className="chat-header">
        <button className="chat-back-btn" onClick={() => navigate(-1)}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="chat-header-center">
          {routeDeparture ? (
            <>
              <div className="chat-header-route">
                {routeDeparture} → {routeDestination}
              </div>
              <div className="chat-header-sub">
                {routeCurrentCount}/{routeMaxCapacity}명 · {chatTimeLabel}
              </div>
            </>
          ) : (
            <div className="chat-header-route">팟 채팅방</div>
          )}
        </div>
        <div className="chat-header-right">
          <button
            className="taxi-call-btn"
            onClick={handleGetTaxiLink}
            title="카카오택시 호출"
          >
            <svg
              width="22"
              height="22"
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
          </button>
        </div>
      </div>

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
                      {maskName(msg.senderUsername)}
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
                      <p className="message-text">
                        {isBotMessage ? maskBotMessage(msg.text) : msg.text}
                      </p>
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
