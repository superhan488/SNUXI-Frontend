import apiClient from './index';

// ================= /admin/reports =================
interface Report {
  id: number;
  isProcessed: boolean;
  reportedAt: string;
  reporterUserId: number;
  reporterEmail: string;
  reportedUserId: number;
  reportedEmail: string;
  reason: 'ABUSE' | 'SPAM' | 'OTHER';
}

// ================= /admin/reports/{reportId} =================
export interface ReportChatLog {
  id: number;
  senderId: number;
  username: string;
  text: string;
  datetimeSendAt: string;
}

export interface ReportDetail extends Report {
  chatLogs: ReportChatLog[];
}

export const getReportById = async (
  reportId: number
): Promise<ReportDetail> => {
  const response = await apiClient.get<ReportDetail>(
    `/admin/reports/${reportId}`
  );
  return response.data;
};

// ================= /admin/reports/{reportId}/status =================
export const markReportAsProcessed = async (
  reportId: number
): Promise<boolean> => {
  const response = await apiClient.patch<boolean>(
    `/admin/reports/${reportId}/status`
  );
  return response.data;
};

// ================= /admin/users/{userId}/suspend =================
export const suspendUser = async (
  userId: number,
  days: number
): Promise<string> => {
  const response = await apiClient.post<string>(
    `/admin/users/${userId}/suspend`,
    { days }
  );
  return response.data;
};

// ================= /admin/users =================
export interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: string;
  createdAt?: string;
  suspended?: boolean;
}

interface AdminUsersResponse {
  content: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const getAdminUsers = async (
  page = 0,
  size = 20
): Promise<AdminUsersResponse> => {
  const response = await apiClient.get<AdminUsersResponse>('/admin/users', {
    params: { page, size },
  });
  return response.data;
};

// ================= /admin/users/{userId}/unsuspend =================
export const unsuspendUser = async (
  userId: number
): Promise<{ userId: number; status: string }> => {
  const response = await apiClient.post<{ userId: number; status: string }>(
    `/admin/users/${userId}/unsuspend`
  );
  return response.data;
};

// ================= /admin/pots =================
export interface AdminPot {
  potId: number;
  departureName: string;
  destinationName: string;
  departureTime: string;
  participantCount: number;
  kakaoDeepLinkStatus: string;
  kakaoDeepLinkAt: string | null;
  kakaoDeepLinkError: string | null;
  createdAt: string;
}

interface AdminPotsResponse {
  content: AdminPot[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const getAdminPots = async (
  page = 0,
  size = 20
): Promise<AdminPotsResponse> => {
  const response = await apiClient.get<AdminPotsResponse>('/admin/pots', {
    params: { page, size },
  });
  return response.data;
};
