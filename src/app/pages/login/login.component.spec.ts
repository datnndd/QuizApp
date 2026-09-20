import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the login component', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component['showPassword']()).toBe(false);

    component.togglePassword();
    expect(component['showPassword']()).toBe(true);

    component.togglePassword();
    expect(component['showPassword']()).toBe(false);
  });

  it('should show error when identifier or password is empty on submit', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component['identifier'].set('');
    component['password'].set('');

    component.onSubmit();
    expect(component['errorMessage']()).toContain('Please enter both your identifier and password.');
  });
});
