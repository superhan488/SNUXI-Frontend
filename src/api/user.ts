import apiClient from './index';

interface UsernameUpdateRequest {
  username: string;
}

export const getUserId = async (): Promise<number> => {
  const response = await apiClient.get<number>('/user/id');
  return response.data;
};

export const updateProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post('/user/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const updateUsername = async (username: string) => {
  const response = await apiClient.patch<UsernameUpdateRequest>(
    '/user/profile/name',
    { username }
  );
  return response.data;
};
