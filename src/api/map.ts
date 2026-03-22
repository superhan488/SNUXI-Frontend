import api from '.';

// eslint-disable-next-line import/prefer-default-export
export const getLandmarks = async () => {
  const response = await api.get('/maps/landmarks');
  return response.data;
};
