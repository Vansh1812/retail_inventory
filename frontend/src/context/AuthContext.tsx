import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../api/axios';
import { ApiResponse, AuthUser, JwtResponse, RegisterRequest, RegisterCustomerRequest } from '../types/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (registerData: RegisterRequest) => Promise<void>;
  registerCustomer: (registerData: RegisterCustomerRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse cached auth state:', e);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<ApiResponse<JwtResponse>>('/auth/login', {
        username,
        password,
      });

      const { token: jwtToken, id, username: uname, email, roles, customerId, supplierId } = response.data.data;

      const authUser: AuthUser = {
        id,
        username: uname,
        email,
        roles,
        customerId,
        supplierId,
      };

      setToken(jwtToken);
      setUser(authUser);

      localStorage.setItem('auth_token', jwtToken);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (registerData: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<ApiResponse<JwtResponse>>('/auth/register', registerData);

      const { token: jwtToken, id, username: uname, email, roles, customerId, supplierId } = response.data.data;

      const authUser: AuthUser = {
        id,
        username: uname,
        email,
        roles,
        customerId,
        supplierId,
      };

      setToken(jwtToken);
      setUser(authUser);

      localStorage.setItem('auth_token', jwtToken);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (registerData: RegisterCustomerRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<ApiResponse<JwtResponse>>('/auth/register-customer', registerData);

      const { token: jwtToken, id, username: uname, email, roles, customerId, supplierId } = response.data.data;

      const authUser: AuthUser = {
        id,
        username: uname,
        email,
        roles,
        customerId,
        supplierId,
      };

      setToken(jwtToken);
      setUser(authUser);

      localStorage.setItem('auth_token', jwtToken);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const hasRole = (roleToCheck: string): boolean => {
    if (!user || !user.roles) return false;
    const normalized = roleToCheck.toUpperCase();
    const roleWithPrefix = normalized.startsWith('ROLE_') ? normalized : `ROLE_${normalized}`;
    const roleWithoutPrefix = normalized.replace(/^ROLE_/, '');

    return user.roles.some((r) => {
      const upper = r.toUpperCase();
      return upper === roleWithPrefix || upper === roleWithoutPrefix;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        registerCustomer,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
