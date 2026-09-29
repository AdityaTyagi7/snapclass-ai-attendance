import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // 25s timeout to prevent freezing the UI forever
});

// Interceptor for API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.detail;
    if (!message) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message = 'Server request timed out. The backend may be cold-starting on Render, please retry in a moment.';
      } else if (error.message === 'Network Error') {
        message = 'Cannot connect to backend server. Please verify Render service is running.';
      } else {
        message = error.message || 'An unexpected error occurred';
      }
    }
    return Promise.reject(new Error(message));
  }
);
