import apiClient from './index';

interface User {
  // id: number;
  email: string;
  username: string;
  profileImageUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/user/profile');
  return response.data;
};

interface TermsRequest {
  token: string;
  termsVersion: number;
}

// 약관 동의 API
export const submitTermsAgreement = async (token: string) => {
  const response = await apiClient.post('/terms/agree', {
    token,
    termsVersion: 0, // 0으로 고정
  } as TermsRequest);
  return response.data;
};

// New API call: Withdraw user
export const withdrawUser = async (): Promise<void> => {
  await apiClient.post('/user/withdraw');
};
