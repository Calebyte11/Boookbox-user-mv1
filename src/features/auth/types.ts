// filepath: /bookbox-pwa/bookbox-pwa/src/features/auth/types/index.ts

export interface User {
  id?: string;
  username: string;
  email: string;
  role: 'sponsor' | 'recipient' | 'guest';
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (user: User) => void;
  logout: () => void;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}