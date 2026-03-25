import React from 'react';
import './RoomCard.css';
import { type RoomData } from '../../types';

interface RoomCardProps {
  room: RoomData;
  onClick: (roomId: number) => void;
  isMyPot?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick, isMyPot }) => {
  const now = new Date();
  const departure = new Date(room.departureTime);
  const diffMin = (departure.getTime() - now.getTime()) / 60000;

  const isToday = departure.toDateString() === now.toDateString();
  const isTomorrow =
    departure.toDateString() ===
    new Date(now.getTime() + 86400000).toDateString();

  const timeLabel = isToday
    ? `오늘 ${departure.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    : isTomorrow
      ? `내일 ${departure.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`
      : departure.toLocaleString('ko-KR', {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

  const isSoonDeparture =
    diffMin > 0 && diffMin <= 60 && room.status === 'SUCCESS';

  let statusText = '모집중';
  let statusClass = 'recruiting';
  if (room.status === 'SUCCESS') {
    statusText = isSoonDeparture ? '곧 출발' : '출발확정';
    statusClass = isSoonDeparture ? 'soon' : 'success';
  } else if (room.status !== 'RECRUITING') {
    statusText = '마감';
    statusClass = 'closed';
  }

  return (
    <div
      className={`room-card${isMyPot ? ' my-pot' : ''}`}
      onClick={() => !isMyPot && onClick(room.roomId)}
    >
      {/* 경로 */}
      <div className="rc-route">
        <div className="rc-node">
          <span className="rc-dot" />
          <span className="rc-name">{room.departure}</span>
        </div>
        <div className="rc-line">
          <span className="rc-dash" />
        </div>
        <div className="rc-node">
          <span className="rc-dot dest" />
          <span className="rc-name">{room.destination}</span>
        </div>
      </div>

      {/* 태그 */}
      <div className="rc-chips">
        <span className="rc-chip">{timeLabel}</span>
        {room.estimatedFee > 0 && (
          <span className="rc-chip">
            ~{room.estimatedFee.toLocaleString()}원
          </span>
        )}
      </div>

      {/* 하단 */}
      <div className="rc-footer">
        <span className="rc-host">{room.hostName}</span>
        <div className="rc-right">
          {isMyPot && <span className="my-pot-badge">참여중</span>}
          <span className={`rc-badge ${statusClass}`}>{statusText}</span>
          <span className="rc-count">
            {room.currentCapacity}/{room.maxCapacity}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
