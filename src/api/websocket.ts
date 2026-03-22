import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WEBSOCKET_URL = 'https://api.snuxi.com/ws';

export const createStompClient = () => {
  const client = new Client({
    // @ts-ignore
    webSocketFactory: () =>
      // @ts-ignore
      new SockJS(WEBSOCKET_URL, null, { withCredentials: true }),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  return client;
};
