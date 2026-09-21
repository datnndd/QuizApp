import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserManagementComponent } from './user-management.component';
import { UserManagementService } from '../../core/services/user-management.service';
import { AuthService } from '../../core/services/auth.service';
import { PagedResult, UserItem, UserStatistics } from '../../core/models/user-management.models';

describe('UserManagementComponent', () => {
  let mockUserService: any;
  let mockAuthService: any;

  const mockUsers: UserItem[] = [
    {
      id: 1,
      firstName: 'Alex',
      lastName: 'Morgan',
      displayName: 'Alex Morgan',
      email: 'alex.morgan@stanford.edu',
      userName: 'amorgan',
      phoneNumber: '+1 (555) 123-4567',
      dateOfBirth: '1995-05-12',
      avatar: null,
      isActive: true,
      isDeleted: false,
      deletedAt: null,
      createdAt: '2026-01-15T00:00:00Z',
      role: 'User',
      roles: ['User']
    },
    {
      id: 2,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      displayName: 'Sarah Jenkins',
      email: 's.jenkins@oxford.ac.uk',
      userName: 'sjenkins',
      phoneNumber: '+1 (555) 987-6543',
      dateOfBirth: '1988-11-20',
      avatar: null,
      isActive: true,
      isDeleted: false,
      deletedAt: null,
      createdAt: '2026-02-10T00:00:00Z',
      role: 'Admin',
      roles: ['Admin']
    },
    {
      id: 3,
      firstName: 'David',
      lastName: 'Kim',
      displayName: 'David Kim',
      email: 'david.kim@berkeley.edu',
      userName: 'dkim',
      phoneNumber: '+1 (555) 345-6789',
      dateOfBirth: '1998-03-25',
      avatar: null,
      isActive: false,
      isDeleted: true,
      deletedAt: '2026-03-01T00:00:00Z',
      createdAt: '2026-01-20T00:00:00Z',
      role: 'User',
      roles: ['User']
    }
  ];

  const mockPagedResult: PagedResult<UserItem> = {
    items: mockUsers,
    totalCount: 3,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  };

  const mockStats: UserStatistics = {
    totalUsers: 3,
    activeUsers: 2,
    inactiveUsers: 0,
    deletedUsers: 1,
    adminUsers: 1,
    standardUsers: 2,
    activeRate: 66.7
  };

  beforeEach(async () => {
    mockUserService = {
      getUsers: vi.fn().mockImplementation((filter: any) =>
        of({
          ...mockPagedResult,
          page: filter?.page || 1,
          pageSize: filter?.pageSize || 10
        })
      ),
      getStatistics: vi.fn().mockReturnValue(of(mockStats)),
      getUserById: vi.fn().mockReturnValue(of(mockUsers[0])),
      createUser: vi.fn().mockReturnValue(of(mockUsers[0])),
      updateUser: vi.fn().mockReturnValue(of(mockUsers[0])),
      deleteUser: vi.fn().mockReturnValue(of(mockUsers[0])),
      restoreUser: vi.fn().mockReturnValue(of(mockUsers[0])),
      updateStatus: vi.fn().mockReturnValue(of(mockUsers[0]))
    };

    mockAuthService = {
      currentUser: () => ({
        id: 999,
        firstName: 'System',
        lastName: 'Admin',
        displayName: 'System Admin',
        email: 'admin@quizzo.com',
        userName: 'admin',
        roles: ['Admin']
      }),
      isAdmin: () => true
    };

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideRouter([]),
        { provide: UserManagementService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should create the user management component', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load users and statistics on init', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockUserService.getUsers).toHaveBeenCalled();
    expect(mockUserService.getStatistics).toHaveBeenCalled();
    expect(component.users().length).toBe(3);
    expect(component.totalCount()).toBe(3);
    expect(component.statistics()?.totalUsers).toBe(3);
    expect(component.statistics()?.activeRate).toBe(66.7);
  });

  it('should search users by query', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSearch('Oxford');
    expect(component.searchQuery()).toBe('Oxford');
    expect(component.page()).toBe(1);
    expect(mockUserService.getUsers).toHaveBeenCalled();
  });

  it('should filter users by role and status', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onRoleChange('Admin');
    expect(component.roleFilter()).toBe('Admin');
    expect(component.page()).toBe(1);

    component.onStatusChange('deleted');
    expect(component.statusFilter()).toBe('deleted');
    expect(component.page()).toBe(1);
  });

  it('should paginate through records', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Set totalPages to 3
    component.onPageSizeChange(25);
    expect(component.pageSize()).toBe(25);
    expect(component.page()).toBe(1);
  });

  it('should toggle user selection and select all', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedCount()).toBe(0);

    component.toggleSelectUser(1);
    expect(component.selectedCount()).toBe(1);
    expect(component.selectedUserIds().has(1)).toBe(true);

    component.selectAllVisible();
    expect(component.selectedCount()).toBe(3);
    expect(component.isAllSelected()).toBe(true);

    component.clearSelection();
    expect(component.selectedCount()).toBe(0);
  });

  it('should open and submit create user modal', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);

    component.createForm = {
      firstName: 'Emily',
      lastName: 'Brown',
      displayName: 'Emily Brown',
      email: 'e.brown@yale.edu',
      userName: 'ebrown',
      password: 'User@123456',
      phoneNumber: '+1 555 111 2222',
      role: 'User',
      isActive: true
    };

    component.submitCreateUser();
    expect(mockUserService.createUser).toHaveBeenCalled();
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('should open and submit edit user modal', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openEditModal(mockUsers[0]);
    expect(component.isEditModalOpen()).toBe(true);
    expect(component.editForm.firstName).toBe('Alex');

    component.editForm.firstName = 'Alexander';
    component.submitEditUser();
    expect(mockUserService.updateUser).toHaveBeenCalled();
    expect(component.isEditModalOpen()).toBe(false);
  });

  it('should open delete modal and soft delete user', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openDeleteModal(mockUsers[0]);
    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.selectedUserForDelete()?.id).toBe(1);

    component.confirmSoftDelete();
    expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
    expect(component.isDeleteModalOpen()).toBe(false);
  });

  it('should restore soft deleted user', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.restoreUser(mockUsers[2]);
    expect(mockUserService.restoreUser).toHaveBeenCalledWith(3);
  });

  it('should toggle user status', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.toggleUserStatus(mockUsers[0]);
    expect(mockUserService.updateStatus).toHaveBeenCalledWith(1, false);
  });

  it('should get initials and avatar colors correctly', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;

    expect(component.getUserInitials(mockUsers[0])).toBe('AM');
    expect(component.getUserInitials(mockUsers[1])).toBe('SJ');

    const adminColor = component.getAvatarColor('Admin');
    expect(adminColor.bg).toContain('bg-[#e2dfff]');

    const userColor = component.getAvatarColor('User');
    expect(userColor.bg).toContain('bg-[#d8e2ff]');
  });

  it('should sort users by role and toggle direction', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSort('role');
    expect(component.sortBy()).toBe('role');
    expect(component.sortDirection()).toBe('asc');
    expect(mockUserService.getUsers).toHaveBeenCalled();

    // Toggle same column
    component.onSort('role');
    expect(component.sortBy()).toBe('role');
    expect(component.sortDirection()).toBe('desc');
  });

  it('should sort users by status', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSort('status');
    expect(component.sortBy()).toBe('status');
    expect(component.sortDirection()).toBe('asc');
  });

  it('should jump to page within range and reject out-of-bounds', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Mock 3 total pages
    component.totalPages.set(3);

    component.jumpToPageInput = 2;
    component.jumpToPage();
    expect(component.page()).toBe(2);

    // Out of bounds jump (should reset to current page)
    component.jumpToPageInput = 99;
    component.jumpToPage();
    expect(component.page()).toBe(2);
    expect(component.jumpToPageInput).toBe(2);
  });

  it('should export CSV with selected users when selection exists', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const createElementSpy = vi.spyOn(document, 'createElement');
    component.toggleSelectUser(1);
    expect(component.selectedCount()).toBe(1);

    component.exportCsv();
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(component.toastMessage()?.text).toContain('1 selected user(s)');
  });

  it('should handle export CSV with no users gracefully', () => {
    const fixture = TestBed.createComponent(UserManagementComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.users.set([]);
    component.exportCsv();
    expect(component.toastMessage()?.text).toBe('No user data to export.');
  });
});
