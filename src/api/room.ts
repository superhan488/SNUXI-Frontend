import apiClient from './index';

interface RoomCreationRequest {
  departureId: number;
  destinationId: number;
  departureTime: string;
  minCapacity: number;
  maxCapacity: number;
  estimatedFee: number;
}

interface RoomCreationResponse {
  createdPotId: number;
}

// 서버 Enum과 일치하는 상태값 정의
export interface Pot {
  id: number;
  ownerId: number;
  departureId: number;
  destinationId: number;
  departureTime: string;
  minCapacity: number;
  maxCapacity: number;
  currentCount: number;
  estimatedFee: number;
  status: 'RECRUITING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  unreadCount: number;
  totalUnreadCount: number; // [추가] 봇 메시지 포함 전체 안 읽은 수
  isLocked: boolean;
}

export interface Message {
  id: number;
  potId: number;
  senderId: number;
  text: string;
  datetimeSendAt: string;
  senderUsername: string;
  senderProfileImageUrl: string | null;
}

interface GetMessagesResponse {
  items: Message[];
  nextCursor: number | null;
  hasNext: boolean;
  readStatuses: Record<number, number>;
}

export const createRoom = async (
  roomDetails: RoomCreationRequest
): Promise<RoomCreationResponse> => {
  const response = await apiClient.post<RoomCreationResponse>(
    '/room',
    roomDetails
  );
  return response.data;
};

export const getCurrentPot = async (): Promise<Pot | null> => {
  const response = await apiClient.get<Pot[]>('/users/me/pots');
  const data = response.data;
  if (!data || data.length === 0) return null;
  return data[0];
};

export const getUserPots = async (): Promise<Pot[]> => {
  const response = await apiClient.get<Pot[]>('/users/me/pots');
  return response.data ?? [];
};

// 방 나가기 API
export const leaveRoom = async (roomId: number): Promise<void> => {
  await apiClient.post(`/rooms/${roomId}/leave`);
};

// 방 삭제 API (방장만 가능)
export const deleteRoom = async (roomId: number): Promise<void> => {
  await apiClient.delete(`/rooms/${roomId}`);
};

export const getMessages = async (
  roomId: number,
  cursor: number | null,
  size = 20
): Promise<GetMessagesResponse> => {
  const response = await apiClient.get<GetMessagesResponse>(
    `/rooms/${roomId}/messages`,
    {
      params: { cursor, size },
    }
  );
  return response.data;
};

export const markAsRead = async (
  roomId: number,
  messageId: number
): Promise<void> => {
  await apiClient.patch(`/rooms/${roomId}/read`, { messageId });
};

interface ReportMessageRequest {
  reason: string;
  targetMessageId: number;
  reportedUserId: number;
}

interface ReportMessageResponse {
  reportId: number;
}

export const reportMessage = async (
  roomId: number,
  report: ReportMessageRequest
): Promise<ReportMessageResponse> => {
  const response = await apiClient.post<ReportMessageResponse>(
    `/rooms/${roomId}/reports`,
    report
  );
  return response.data;
};

// New API call: Get Kakao Deep Link
export const getKakaoDeepLink = async (roomId: number): Promise<string> => {
  const response = await apiClient.get<string>(
    `/rooms/${roomId}/kakao-deep-link`
  );
  return response.data;
};

// New API call: Kick user from room
export const kickUserFromRoom = async (
  roomId: number,
  targetUserId: number
): Promise<void> => {
  await apiClient.delete(`/rooms/${roomId}/members/${targetUserId}`);
};

// 방 모집 상태 변경 (Lock/Unlock)
export const updateRoomStatus = async (
  roomId: number,
  isLocked: boolean
): Promise<void> => {
  await apiClient.patch(`/rooms/${roomId}/status`, { isLocked });
};

export interface Participant {
  userId: number;
  username: string;
  profileImageUrl: string;
  role: string;
}

// New API call: Get room participants
export const getRoomParticipants = async (
  roomId: number
): Promise<Participant[]> => {
  const response = await apiClient.get<Participant[]>(
    `/rooms/${roomId}/participants`
  );
  return response.data;
};
