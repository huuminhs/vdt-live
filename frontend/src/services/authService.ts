import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:8080/api';

// Types for the API requests and responses
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginSuccessResponse {
  token: string;
  tokenType: string;
  username: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterSuccessResponse {
  username: string;
  message: string;
}

export interface AuthErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// Create axios instance with base configuration
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Login function to authenticate user
 * @param credentials - Object containing username and password
 * @returns Promise with login response or throws error
 */
export const login = async (credentials: LoginRequest): Promise<LoginSuccessResponse> => {
  try {
    const response: AxiosResponse<LoginSuccessResponse> = await authAPI.post(
      '/auth/login',
      credentials
    );
    
    return response.data;  } catch (error) {
    // Handle axios error
    if (axios.isAxiosError(error) && error.response) {
      const errorData: AuthErrorResponse = error.response.data;
      throw new Error(errorData.message || 'Login failed');
    }
    
    // Handle other errors
    throw new Error('Network error or server unavailable');
  }
};

/**
 * Register function to create a new user account
 * @param credentials - Object containing username and password
 * @returns Promise with registration response or throws error
 */
export const register = async (credentials: RegisterRequest): Promise<RegisterSuccessResponse> => {
  try {
    const response: AxiosResponse<RegisterSuccessResponse> = await authAPI.post(
      '/auth/register',
      credentials
    );
    
    return response.data;
  } catch (error) {
    // Handle axios error
    if (axios.isAxiosError(error) && error.response) {
      const errorData: AuthErrorResponse = error.response.data;
      throw new Error(errorData.message || 'Registration failed');
    }
    
    // Handle other errors
    throw new Error('Network error or server unavailable');
  }
};

/**
 * Example usage:
 * 
 * Login:
 * try {
 *   const result = await login({ username: 'admin', password: 'admin' });
 *   console.log('Login successful:', result);
 *   // Handle successful login (e.g., store token, redirect)
 * } catch (error) {
 *   console.error('Login failed:', error.message);
 *   // Handle login error (e.g., show error message)
 * }
 * 
 * Register:
 * try {
 *   const result = await register({ username: 'orange-cat', password: '12345678' });
 *   console.log('Registration successful:', result);
 *   // Handle successful registration (e.g., show success message, redirect to login)
 * } catch (error) {
 *   console.error('Registration failed:', error.message);
 *   // Handle registration error (e.g., show error message)
 * }
 */
