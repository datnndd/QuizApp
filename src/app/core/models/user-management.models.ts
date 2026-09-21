export interface UserItem {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  userName: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  avatar?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  role: 'Admin' | 'User';
  roles: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UserQueryFilter {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  deletedUsers: number;
  adminUsers: number;
  standardUsers: number;
  activeRate: number;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  userName: string;
  password?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatar?: string;
  role?: 'Admin' | 'User';
  isActive?: boolean;
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatar?: string;
  role?: 'Admin' | 'User';
  isActive: boolean;
  password?: string;
}
