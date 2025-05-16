import axios, { AxiosError } from 'axios';

export const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/token/refresh/') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.log("No refresh token available (mobile), logging out.");
          localStorage.removeItem('accessToken');
          localStorage.removeItem('loggedInUser');
          // Handle logout, e.g., by navigating or using a global state management for auth
          // window.location.href = '/login'; // Or use react-router navigate if available here
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken });
        const { access } = response.data;
        
        localStorage.setItem('accessToken', access);
        
        if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed (mobile)", refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('loggedInUser');
        // Handle logout
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient; 