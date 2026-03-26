import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLandmarks } from '../../api/map';
import type { Message } from '../../api/room';
import { getMessages } from '../../api/room';
import './AdminChatView.css';

const AdminChatView = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [_landmarkMap, setLandmarkMap] = useState<Record<number, string>>({});

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const msgHistoryTick = useRef(false);
  const needsInitialScroll = useRef(true);

  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const data = await getLandmarks();
        if (data?.landmarks) {
          const map: Record<number, string> = {};
          // biome-ignore lint/suspicious/noExplicitAny:
          for (const l of data.landmarks as any[]) {
            map[l.id] = l.name;
          }
          setLandmarkMap(map);
        }
      } catch {
        // ignore
      }
    };
    fetchLandmarks();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await getMessages(parseInt(roomId, 10), null, 50);
        setMessages([...res.items].reverse());
        setCursor(res.nextCursor);
        setHasNext(res.hasNext);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [roomId]);

  useLayoutEffect(() => {
    if (
      messages.length > 0 &&
      !loading &&
      needsInitialScroll.current &&
      scrollContainerRef.current
    ) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
      needsInitialScroll.current = false;
    }
  }, [loading, messages]);

  useLayoutEffect(() => {
    if (
      messages.length > 0 &&
      scrollContainerRef.current &&
      msgHistoryTick.current
    ) {
      const container = scrollContainerRef.current;
      const diff = container.scrollHeight - prevScrollHeightRef.current;
      if (diff > 0) container.scrollTop = diff;
      container.style.overflowY = 'auto';
      setFetchingMore(false);
      msgHistoryTick.current = false;
    }
  }, [messages]);

  const fetchMoreMessages = useCallback(async () => {
    if (!roomId || !hasNext || fetchingMore || loading) return;
    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.style.overflowY = 'hidden';
    }
    setFetchingMore(true);
    try {
      const res = await getMessages(parseInt(roomId, 10), cursor, 40);
      const older = [...res.items].reverse();
      msgHistoryTick.current = true;
      setMessages((prev) => [...older, ...prev]);
      setCursor(res.nextCursor);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('Error fetching more messages:', err);
      if (scrollContainerRef.current)
        scrollContainerRef.current.style.overflowY = 'auto';
      setFetchingMore(false);
    }
  }, [roomId, hasNext, cursor, fetchingMore, loading]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop } = scrollContainerRef.current;
      if (scrollTop === 0 && hasNext && !fetchingMore) {
        fetchMoreMessages();
      }
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  if (loading) {
    return (
      <div className="admin-chat-loading">
        <p>메시지 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="admin-chat-container">
      <div className="admin-chat-header">
        <button
          className="admin-chat-back-btn"
          onClick={() => navigate('/admin')}
        >
          ← 관리자 페이지로
        </button>
        <span className="admin-chat-title">
          팟 #{roomId} 채팅 (관리자 열람)
        </span>
        <span className="admin-chat-badge">읽기 전용</span>
      </div>

      <div
        className="admin-chat-messages"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {fetchingMore && (
          <div className="admin-chat-fetching">이전 메시지 로딩 중...</div>
        )}
        {messages.map((msg, index) => {
          const isBotMessage = msg.senderId === 7;
          const currentDate = formatDate(msg.datetimeSendAt);
          const prevDate =
            index > 0 ? formatDate(messages[index - 1].datetimeSendAt) : null;
          const showDateSeparator = currentDate !== prevDate;

          return (
            <div key={msg.id || `msg-${index}`}>
              {showDateSeparator && (
                <div className="admin-date-separator">{currentDate}</div>
              )}
              {isBotMessage ? (
                <div className="admin-bot-message">{msg.text}</div>
              ) : (
                <div className="admin-message-row">
                  <img
                    src={
                      msg.senderProfileImageUrl ||
                      'https://via.placeholder.com/32'
                    }
                    alt={msg.senderUsername}
                    className="admin-profile-pic"
                  />
                  <div className="admin-message-body">
                    <div className="admin-sender-name">
                      {msg.senderUsername}
                    </div>
                    <div className="admin-message-bubble">{msg.text}</div>
                  </div>
                  <span className="admin-message-time">
                    {new Date(msg.datetimeSendAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="admin-no-messages">메시지가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default AdminChatView;
