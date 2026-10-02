import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, of, switchMap, take, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  RevokeTokenRequest,
  UpdateProfileRequest,
  UserInfo
} from '../models/auth.models';

const TOKEN_KEY = 'quizzo_access_token';
const REFRESH_TOKEN_KEY = 'quizzo_refresh_token';
const USER_KEY = 'quizzo_user_profile';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly refreshTokenSignal = signal<string | null>(this.getStoredRefreshToken());
  private readonly currentUserSignal = signal<UserInfo | null>(this.getStoredUser());

  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly currentRefreshToken = this.refreshTokenSignal.asReadonly();
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

  refreshToken(): Observable<AuthResponse> {
    const currentRefreshToken = this.getStoredRefreshToken();
    if (!currentRefreshToken) {
      return throwError(() => new Error('No refresh token available.'));
    }

    const payload: RefreshTokenRequest = { refreshToken: currentRefreshToken };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, payload).pipe(
      tap((res) => this.setSession(res)),
      catchError((err) => {
        this.clearSession();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  handle401(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    if (!this.getStoredRefreshToken()) {
      this.logout();
      return throwError(() => new Error('No refresh token available.'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap((authRes: AuthResponse) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(authRes.accessToken);
          return next(this.addTokenHeader(req, authRes.accessToken));
        }),
        catchError((err: unknown) => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => next(this.addTokenHeader(req, token)))
      );
    }
  }

  addTokenHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getMe(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.persistUser(user);
      })
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserInfo> {
    return this.http.put<UserInfo>(`${environment.apiUrl}/auth/me`, request).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.persistUser(user);
      })
    );
  }

  logout(): void {
    const currentRefreshToken = this.getStoredRefreshToken();
    if (currentRefreshToken) {
      const payload: RevokeTokenRequest = { refreshToken: currentRefreshToken };
      this.http.post(`${environment.apiUrl}/auth/revoke`, payload).pipe(
        catchError(() => of(null))
      ).subscribe();
    }

    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  private setSession(auth: AuthResponse): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TOKEN_KEY, auth.accessToken);
      if (auth.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    }
    this.tokenSignal.set(auth.accessToken);
    if (auth.refreshToken) {
      this.refreshTokenSignal.set(auth.refreshToken);
    }
    this.currentUserSignal.set(auth.user);
  }

  private clearSession(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
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
