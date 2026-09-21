export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  userName: string;
  phoneNumber?: string | null;
  avatar?: string | null;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
}
