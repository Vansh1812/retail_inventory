import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types/api';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (attaches JWT when auth module is activated)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export interface ApiClientError extends Error {
  status?: number;
  data?: unknown;
}

// Response Interceptor (standardized error handling aligned with ApiResponse)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    let errorMessage = 'An unexpected server error occurred';

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (error.response?.status === 401) {
      console.warn('Unauthorized access - please login.');
    } else if (error.response?.status === 403) {
      console.warn('Access denied - insufficient permissions.');
    } else if (error.response?.status === 500) {
      console.error('Internal Server Error:', errorMessage);
    }

    const clientError: ApiClientError = new Error(errorMessage);
    clientError.status = error.response?.status;
    clientError.data = error.response?.data?.data;

    return Promise.reject(clientError);
  }
);

export default apiClient;
