export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
}

export interface AuthUser {
  id?: number;
  username: string;
  email: string;
  roles: string[];
  customerId?: number;
  supplierId?: number;
}

export interface JwtResponse {
  token: string;
  type: string;
  id?: number;
  username: string;
  email: string;
  roles: string[];
  customerId?: number;
  supplierId?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface RegisterCustomerRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
}
