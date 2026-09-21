import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserInfo } from '../models/auth.models';

const TOKEN_KEY = 'quizzo_access_token';
const USER_KEY = 'quizzo_user_profile';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly currentUserSignal = signal<UserInfo | null>(this.getStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.currentUserSignal());
  readonly userRoles = computed(() => this.currentUserSignal()?.roles ?? []);
  readonly isAdmin = computed(() => this.userRoles().includes('Admin'));

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request).pipe(
      tap((res) => this.setSession(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((res) => this.setSession(res))
    );
  }

  getMe(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.persistUser(user);
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private setSession(auth: AuthResponse): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TOKEN_KEY, auth.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    }
    this.tokenSignal.set(auth.accessToken);
    this.currentUserSignal.set(auth.user);
  }

  private clearSession(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private getStoredUser(): UserInfo | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(USER_KEY);
      if (data) {
        try {
          return JSON.parse(data) as UserInfo;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private persistUser(user: UserInfo): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }
}
