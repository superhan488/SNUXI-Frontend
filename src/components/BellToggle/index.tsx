import { useState } from 'react';
import {
  isNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
} from '../../utils/notifications';

interface BellToggleProps {
  className?: string;
}

const BellToggle = ({ className }: BellToggleProps) => {
  const [enabled, setEnabled] = useState(isNotificationsEnabled);

  const handleToggle = async () => {
    if (!enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
        return;
      }
    }
    const next = !enabled;
    setNotificationsEnabled(next);
    setEnabled(next);
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleToggle}
      aria-label={enabled ? '알림 끄기' : '알림 켜기'}
    >
      {enabled ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13.73 21a2 2 0 01-3.46 0" />
          <path d="M18.63 13A17.89 17.89 0 0118 8" />
          <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" />
          <path d="M18 8a6 6 0 00-9.33-5" />
          <line x1="3" y1="3" x2="21" y2="21" />
        </svg>
      )}
    </button>
  );
};

export default BellToggle;
