import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let authServiceMock: {
    isAuthenticated: () => boolean;
    isAdmin: () => boolean;
  };
  let routerMock: {
    createUrlTree: (commands: any[], navigationExtras?: any) => UrlTree;
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = { url: '/admin' } as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: () => false,
      isAdmin: () => false
    };

    routerMock = {
      createUrlTree: (commands: any[], navigationExtras?: any) => {
        return {
          toString: () => commands.join('/') + (navigationExtras?.queryParams ? `?${JSON.stringify(navigationExtras.queryParams)}` : '')
        } as unknown as UrlTree;
      }
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should redirect unauthenticated user to /login', () => {
    authServiceMock.isAuthenticated = () => false;
    authServiceMock.isAdmin = () => false;

    const result = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, dummyState));
    expect(result).not.toBe(true);
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/login');
  });

  it('should redirect authenticated non-admin user to /dashboard with unauthorized flag', () => {
    authServiceMock.isAuthenticated = () => true;
    authServiceMock.isAdmin = () => false;

    const result = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, dummyState));
    expect(result).not.toBe(true);
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/dashboard');
    expect(tree.toString()).toContain('unauthorized');
  });

  it('should allow access when user is authenticated and has Admin role', () => {
    authServiceMock.isAuthenticated = () => true;
    authServiceMock.isAdmin = () => true;

    const result = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, dummyState));
    expect(result).toBe(true);
  });
});
