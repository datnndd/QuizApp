import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the navbar component', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should toggle mobile menu', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    const component = fixture.componentInstance;
    expect(component.mobileMenuOpen()).toBe(false);

    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);
  });

  it('should toggle user menu', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    const component = fixture.componentInstance;
    expect(component.userMenuOpen()).toBe(false);

    component.toggleUserMenu();
    expect(component.userMenuOpen()).toBe(true);

    component.toggleUserMenu();
    expect(component.userMenuOpen()).toBe(false);
  });
});
