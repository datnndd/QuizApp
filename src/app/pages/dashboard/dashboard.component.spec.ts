import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the dashboard component', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize with "all" filter and 3 decks', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component['activeFilter']()).toBe('all');
    expect(component['filteredDecks']().length).toBe(3);
  });

  it('should filter decks by "review" category correctly', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.setFilter('review');
    expect(component['activeFilter']()).toBe('review');
    expect(component['filteredDecks']().length).toBe(2);
    expect(component['filteredDecks']().every((d) => d.badgeType === 'review' || d.badgeType === 'decay')).toBe(true);
  });

  it('should filter decks by "new" category correctly', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.setFilter('new');
    expect(component['activeFilter']()).toBe('new');
    expect(component['filteredDecks']().length).toBe(1);
    expect(component['filteredDecks']()[0].badgeType).toBe('new');
  });

  it('should toggle priority sorting order', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component['prioritySorted']()).toBe(false);

    component.togglePriority();
    expect(component['prioritySorted']()).toBe(true);
    // When priority sorted, astrophysics (priorityOrder: 1) comes first
    expect(component['filteredDecks']()[0].id).toBe('astrophysics-1');

    component.togglePriority();
    expect(component['prioritySorted']()).toBe(false);
  });

  it('should render user information and streak in the template', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Alex Morgan');
    expect(compiled.textContent).toContain('5-Day');
    expect(compiled.textContent).toContain('Adaptive Daily Spaced Sprint');
  });
});
