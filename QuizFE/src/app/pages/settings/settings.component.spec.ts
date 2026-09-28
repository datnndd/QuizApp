import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';

const mockUser = {
  id: 1,
  firstName: 'Alex',
  lastName: 'Morgan',
  displayName: 'Alex Morgan',
  email: 'alex@quizzo.com',
  userName: 'alexm',
  phoneNumber: '+1 (555) 000-0001',
  avatar: null,
  roles: ['User']
};

describe('SettingsComponent', () => {
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      currentUser: () => mockUser,
      isAuthenticated: () => true,
      isAdmin: () => false,
      userRoles: () => ['User'],
      getMe: vi.fn().mockReturnValue(of(mockUser)),
      updateProfile: vi.fn().mockReturnValue(of({
        ...mockUser,
        displayName: 'Alex M.'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should create settings component and populate form with user data', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.firstName()).toBe('Alex');
    expect(component.lastName()).toBe('Morgan');
    expect(component.displayName()).toBe('Alex Morgan');
    expect(component.email()).toBe('alex@quizzo.com');
    expect(component.userInitials()).toBe('AM');
  });

  it('should toggle password change section', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.showPasswordSection()).toBe(false);
    component.togglePasswordSection();
    expect(component.showPasswordSection()).toBe(true);
    component.togglePasswordSection();
    expect(component.showPasswordSection()).toBe(false);
  });

  it('should validate required fields before saving', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.firstName.set('');
    component.saveProfile();
    expect(component.errorMessage()).toBe('First name is required.');
    expect(mockAuthService.updateProfile).not.toHaveBeenCalled();

    component.firstName.set('Alex');
    component.email.set('invalid-email');
    component.saveProfile();
    expect(component.errorMessage()).toBe('A valid email address is required.');
  });

  it('should validate password mismatch if changing password', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.currentPassword.set('oldPassword');
    component.newPassword.set('newPassword123');
    component.confirmPassword.set('differentPassword');

    component.saveProfile();
    expect(component.errorMessage()).toBe('New password and confirmation do not match.');
    expect(mockAuthService.updateProfile).not.toHaveBeenCalled();
  });

  it('should successfully save profile updates', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.displayName.set('Alex M.');
    component.saveProfile();

    expect(mockAuthService.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'Alex',
      lastName: 'Morgan',
      displayName: 'Alex M.',
      email: 'alex@quizzo.com'
    }));
    expect(component.successMessage()).toBe('Profile information updated successfully!');
  });
});
