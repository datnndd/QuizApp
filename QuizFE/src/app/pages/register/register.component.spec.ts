import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the register component', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility flags', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    expect(component['showPassword']()).toBe(false);
    expect(component['showConfirmPassword']()).toBe(false);

    component.togglePassword();
    expect(component['showPassword']()).toBe(true);

    component.toggleConfirmPassword();
    expect(component['showConfirmPassword']()).toBe(true);
  });

  it('should show error when required fields are empty on submit', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.onSubmit();
    expect(component['errorMessage']()).toBe('Please fill out all required fields.');
  });

  it('should validate passwords matching on submit', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component['firstName'].set('Alex');
    component['lastName'].set('Rider');
    component['username'].set('quiz_champ');
    component['email'].set('alex@example.com');
    component['password'].set('password123');
    component['confirmPassword'].set('differentPassword');

    component.onSubmit();
    expect(component['errorMessage']()).toBe('Passwords do not match. Please verify.');
  });
});
