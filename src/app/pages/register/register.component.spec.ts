import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([])]
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
});
