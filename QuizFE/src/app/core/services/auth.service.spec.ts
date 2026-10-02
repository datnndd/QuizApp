import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'test_access_token_123',
    refreshToken: 'test_refresh_token_456',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      id: 1,
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      email: 'test@example.com',
      userName: 'testuser',
      roles: ['User']
    }
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should store access and refresh tokens on login', () => {
    service.login({ identifier: 'test@example.com', password: 'password123' }).subscribe((res: AuthResponse) => {
      expect(res.accessToken).toBe('test_access_token_123');
      expect(res.refreshToken).toBe('test_refresh_token_456');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.getToken()).toBe('test_access_token_123');
    expect(service.getRefreshToken()).toBe('test_refresh_token_456');
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('quizzo_access_token')).toBe('test_access_token_123');
    expect(localStorage.getItem('quizzo_refresh_token')).toBe('test_refresh_token_456');
  });

  it('should call refresh endpoint with stored refresh token and rotate tokens', () => {
    // Seed initial session
    (service as any).setSession(mockAuthResponse);

    const rotatedResponse: AuthResponse = {
      ...mockAuthResponse,
      accessToken: 'new_access_token_789',
      refreshToken: 'new_refresh_token_999'
    };

    service.refreshToken().subscribe((res: AuthResponse) => {
      expect(res.accessToken).toBe('new_access_token_789');
      expect(res.refreshToken).toBe('new_refresh_token_999');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'test_refresh_token_456' });
    req.flush(rotatedResponse);

    expect(service.getToken()).toBe('new_access_token_789');
    expect(service.getRefreshToken()).toBe('new_refresh_token_999');
  });

  it('should throw error when refreshToken is called without a stored token', () => {
    let errorCaught = false;
    service.refreshToken().subscribe({
      next: () => {
        throw new Error('Should have failed');
      },
      error: (err: any) => {
        errorCaught = true;
        expect(err.message).toContain('No refresh token available');
      }
    });

    expect(errorCaught).toBe(true);
    httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
  });

  it('should clear session, call revoke, and redirect on logout', () => {
    (service as any).setSession(mockAuthResponse);
    const navigateSpy = vi.spyOn(router, 'navigate');

    service.logout();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/revoke`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'test_refresh_token_456' });
    req.flush({ message: 'Token revoked successfully.' });

    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('handle401 should refresh token and retry failed request with new token', () => {
    (service as any).setSession(mockAuthResponse);

    const originalReq = new HttpRequest('GET', `${environment.apiUrl}/quizzes`);
    const nextFn = vi.fn().mockImplementation((req: HttpRequest<unknown>) => {
      expect(req.headers.get('Authorization')).toBe('Bearer rotated_token');
      return of(new HttpResponse({ status: 200 }));
    });

    const rotatedResponse: AuthResponse = {
      ...mockAuthResponse,
      accessToken: 'rotated_token',
      refreshToken: 'rotated_refresh_token'
    };

    service.handle401(originalReq, nextFn as any).subscribe();

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush(rotatedResponse);

    expect(nextFn).toHaveBeenCalled();
  });
});
