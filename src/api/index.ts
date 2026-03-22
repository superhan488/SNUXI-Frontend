import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.snuxi.com',
  withCredentials: true,
});

export default apiClient;
