const STORAGE_KEY = 'snuxi-notifications-enabled';

export const isNotificationsEnabled = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

export const setNotificationsEnabled = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const getNotificationPermission = ():
  | NotificationPermission
  | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const showNotification = (
  title: string,
  body: string,
  url?: string
): void => {
  if (!isNotificationsEnabled()) return;
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/snuxi-logo.png',
          badge: '/snuxi-logo.png',
          tag: 'snuxi-chat',
          data: { url: url || '/my-chat' },
        });
      })
      .catch(() => {
        new Notification(title, { body, icon: '/snuxi-logo.png' });
      });
  } else {
    new Notification(title, { body, icon: '/snuxi-logo.png' });
  }
};

// 봇 메시지 텍스트로부터 알림 제목 판단
export const getBotNotificationTitle = (text: string): string => {
  const lower = text.toLowerCase();
  if (
    lower.includes('성공') ||
    lower.includes('확정') ||
    lower.includes('완성') ||
    lower.includes('출발')
  ) {
    return '팟 출발 확정!';
  }
  if (
    lower.includes('실패') ||
    lower.includes('만료') ||
    lower.includes('취소') ||
    lower.includes('해체') ||
    lower.includes('종료')
  ) {
    return '팟이 해체되었습니다';
  }
  return 'SNUXI 알림';
};
