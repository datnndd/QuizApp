import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    getToken: () => string | null;
    addTokenHeader: (req: any, token: string) => any;
    handle401: (req: any, next: any) => any;
  };

  beforeEach(() => {
    authServiceMock = {
      getToken: vi.fn().mockReturnValue('mock_access_token'),
      addTokenHeader: vi.fn().mockImplementation((req: any, token: string) =>
        req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      ),
      handle401: vi.fn().mockReturnValue(of({ status: 200 }))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Authorization header for API requests when token exists', () => {
    http.get(`${environment.apiUrl}/quizzes`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/quizzes`);
    expect(authServiceMock.addTokenHeader).toHaveBeenCalled();
    req.flush([]);
  });

  it('should delegate to authService.handle401 on 401 error for protected endpoints', () => {
    http.get(`${environment.apiUrl}/quizzes`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/quizzes`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.handle401).toHaveBeenCalled();
  });

  it('should not call handle401 on 401 for auth endpoints like login or refresh', () => {
    let errorCaught = false;
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({
      error: () => {
        errorCaught = true;
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorCaught).toBe(true);
    expect(authServiceMock.handle401).not.toHaveBeenCalled();
  });
});
