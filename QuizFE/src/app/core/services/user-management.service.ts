import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUserPayload,
  PagedResult,
  UpdateUserPayload,
  UserItem,
  UserQueryFilter,
  UserStatistics
} from '../models/user-management.models';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getUsers(filter: UserQueryFilter): Observable<PagedResult<UserItem>> {
    let params = new HttpParams();

    if (filter.search && filter.search.trim()) {
      params = params.set('search', filter.search.trim());
    }

    if (filter.role && filter.role !== 'all') {
      params = params.set('role', filter.role);
    }

    if (filter.status && filter.status !== 'all') {
      params = params.set('status', filter.status);
    }

    if (filter.page) {
      params = params.set('page', filter.page.toString());
    }

    if (filter.pageSize) {
      params = params.set('pageSize', filter.pageSize.toString());
    }

    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }

    if (filter.sortDirection) {
      params = params.set('sortDirection', filter.sortDirection);
    }

    return this.http.get<PagedResult<UserItem>>(this.baseUrl, { params });
  }

  getStatistics(): Observable<UserStatistics> {
    return this.http.get<UserStatistics>(`${this.baseUrl}/statistics`);
  }

  getUserById(id: number): Observable<UserItem> {
    return this.http.get<UserItem>(`${this.baseUrl}/${id}`);
  }

  createUser(payload: CreateUserPayload): Observable<UserItem> {
    return this.http.post<UserItem>(this.baseUrl, payload);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<UserItem> {
    return this.http.put<UserItem>(`${this.baseUrl}/${id}`, payload);
  }

  deleteUser(id: number): Observable<UserItem> {
    return this.http.delete<UserItem>(`${this.baseUrl}/${id}`);
  }

  restoreUser(id: number): Observable<UserItem> {
    return this.http.post<UserItem>(`${this.baseUrl}/${id}/restore`, {});
  }

  updateStatus(id: number, isActive: boolean): Observable<UserItem> {
    return this.http.patch<UserItem>(`${this.baseUrl}/${id}/status`, { isActive });
  }
}
