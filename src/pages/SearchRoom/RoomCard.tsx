import React from 'react';
import './RoomCard.css';
import { type RoomData } from '../../types';

interface RoomCardProps {
  room: RoomData;
  onClick: (roomId: number) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  // 날짜 포맷팅
  const formattedTime = new Date(room.departureTime).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 상태에 따른 텍스트 및 스타일 결정
  let statusText = '모집중';
  let statusClass = 'recruiting';

  if (room.status === 'SUCCESS') {
    statusText = '출발확정';
    statusClass = 'success';
  } else if (room.status === 'RECRUITING') {
    statusText = '모집중';
    statusClass = 'recruiting';
  } else {
    // FAILED, EXPIRED 등
    statusText = '마감';
    statusClass = 'closed';
  }

  return (
    <div className="room-card" onClick={() => onClick(room.roomId)}>
      {/* 1. 경로 정보 (위아래 배치) */}
      <div className="room-route-row">
        {/* 첫 번째 줄: 출발지 */}
        <div className="location departure">{room.departure}</div>

        {/* 두 번째 줄: 화살표 + 도착지 */}
        <div className="route-destination-row">
          <div className="arrow">→</div>
          <div className="location destination">{room.destination}</div>
        </div>
      </div>

      {/* 2. 상세 정보 */}
      <div className="room-details-row">
        <span className="info-item time">{formattedTime}</span>
        <span className="info-divider">|</span>
        <span className="info-item min-cap">최소 {room.minCapacity}명</span>
      </div>

      {/* 3. 하단 (방장, 상태/인원 분리) */}
      <div className="room-footer-row">
        <div className="host-info">
          <span className="host-name">{room.hostName}</span>
        </div>

        <div className="status-container">
          {/* 상태 배지 (모집중/출발확정) */}
          <span className={`status-badge ${statusClass}`}>{statusText}</span>
          {/* 인원수 (항상 검정색) */}
          <span className="headcount-fixed">
            {room.currentCapacity}/{room.maxCapacity}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
