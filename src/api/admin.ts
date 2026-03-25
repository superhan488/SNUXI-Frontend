import apiClient from './index';

// ================= /admin/reports =================
export interface Report {
  id: number;
  isProcessed: boolean;
  reportedAt: string;
  reporterUserId: number;
  reporterEmail: string;
  reportedUserId: number;
  reportedEmail: string;
  reason: 'ABUSE' | 'SPAM' | 'OTHER';
}

interface Pageable {
  page: number;
  size: number;
  sort?: string[];
}

export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface GetReportsResponse {
  content: Report[];
  page: PageInfo;
}

interface GetReportsParams {
  isProcessed?: boolean;
  reporterId?: number;
  reportedId?: number;
  pageable: Pageable;
}

export const getReports = async (
  params: GetReportsParams
): Promise<GetReportsResponse> => {
  const response = await apiClient.get<GetReportsResponse>('/admin/reports', {
    params,
  });
  return response.data;
};

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
  isSuspended?: boolean;
}

interface AdminUsersResponse {
  content: AdminUser[];
  page: PageInfo;
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

// ================= /admin/rooms =================
export interface AdminRoom {
  id: number;
  departureId: number;
  destinationId: number;
  departureTime: string;
  status: string;
  currentCount: number;
  maxCapacity: number;
  minCapacity: number;
}

interface AdminRoomsResponse {
  content: AdminRoom[];
  page: PageInfo;
}

export const getAdminRooms = async (
  page = 0,
  size = 10
): Promise<AdminRoomsResponse> => {
  const response = await apiClient.get<AdminRoomsResponse>('/admin/rooms', {
    params: { page, size },
  });
  return response.data;
};
