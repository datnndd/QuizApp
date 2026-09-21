import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserManagementService } from '../../core/services/user-management.service';
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserItem,
  UserQueryFilter,
  UserStatistics
} from '../../core/models/user-management.models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private readonly userManagementService = inject(UserManagementService);
  private readonly authService = inject(AuthService);

  // Admin Profile
  readonly currentUser = this.authService.currentUser;
  readonly adminName = computed(() => this.currentUser()?.displayName || 'Alex Morgan');
  readonly adminEmail = computed(() => this.currentUser()?.email || 'alex.morgan@stanford.edu');
  readonly adminRole = computed(() => (this.authService.isAdmin() ? 'Super Admin' : 'Admin'));
  readonly adminInitials = computed(() => {
    const user = this.currentUser();
    if (user && user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'AM';
  });

  // Ledger State
  readonly users = signal<UserItem[]>([]);
  readonly totalCount = signal<number>(0);
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly isLoading = signal<boolean>(false);
  readonly queryDurationMs = signal<number>(24);

  // Statistics State
  readonly statistics = signal<UserStatistics | null>(null);
  readonly statsLoading = signal<boolean>(false);

  // Filter & Search State
  readonly searchQuery = signal<string>('');
  readonly roleFilter = signal<string>('all');
  readonly statusFilter = signal<string>('all');
  readonly sortBy = signal<string>('id');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Selection State
  readonly selectedUserIds = signal<Set<number>>(new Set());

  // Modal State
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedUserForEdit = signal<UserItem | null>(null);
  readonly selectedUserForDelete = signal<UserItem | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  // Feedback Notification
  readonly toastMessage = signal<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Jump to page input
  jumpToPageInput = 1;

  // Forms
  createForm: CreateUserPayload = {
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    userName: '',
    password: '',
    phoneNumber: '',
    role: 'User',
    isActive: true
  };

  editForm: UpdateUserPayload & { id: number; userName: string } = {
    id: 0,
    userName: '',
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'User',
    isActive: true,
    password: ''
  };

  readonly isAllSelected = computed(() => {
    const list = this.users();
    const selected = this.selectedUserIds();
    if (list.length === 0) return false;
    return list.every((u) => selected.has(u.id));
  });

  readonly selectedCount = computed(() => this.selectedUserIds().size);

  ngOnInit(): void {
    this.loadUsers();
    this.loadStatistics();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    const startTime = performance.now();

    const filter: UserQueryFilter = {
      search: this.searchQuery(),
      role: this.roleFilter(),
      status: this.statusFilter(),
      page: this.page(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection()
    };

    this.userManagementService.getUsers(filter).subscribe({
      next: (result) => {
        this.users.set(result.items);
        this.totalCount.set(result.totalCount);
        this.page.set(result.page);
        this.pageSize.set(result.pageSize);
        this.totalPages.set(result.totalPages);
        this.jumpToPageInput = result.page;
        this.isLoading.set(false);
        this.queryDurationMs.set(Math.round(performance.now() - startTime));
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showToast('Failed to load users. Please check backend connection.', 'error');
      }
    });
  }

  loadStatistics(): void {
    this.statsLoading.set(true);
    this.userManagementService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.statsLoading.set(false);
      },
      error: () => {
        this.statsLoading.set(false);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadUsers();
  }

  onRoleChange(role: string): void {
    this.roleFilter.set(role);
    this.page.set(1);
    this.loadUsers();
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadUsers();
  }

  onSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('asc');
    }
    this.loadUsers();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages() && newPage !== this.page()) {
      this.page.set(newPage);
      this.loadUsers();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    this.loadUsers();
  }

  jumpToPage(): void {
    const p = Number(this.jumpToPageInput);
    if (!isNaN(p) && p >= 1 && p <= this.totalPages()) {
      this.onPageChange(p);
    } else {
      this.jumpToPageInput = this.page();
    }
  }

  // Selection
  toggleSelectUser(id: number): void {
    const set = new Set(this.selectedUserIds());
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.selectedUserIds.set(set);
  }

  toggleSelectAllCurrentPage(): void {
    const set = new Set(this.selectedUserIds());
    const currentUsers = this.users();
    const allSelected = currentUsers.every((u) => set.has(u.id));

    if (allSelected) {
      currentUsers.forEach((u) => set.delete(u.id));
    } else {
      currentUsers.forEach((u) => set.add(u.id));
    }
    this.selectedUserIds.set(set);
  }

  clearSelection(): void {
    this.selectedUserIds.set(new Set());
  }

  selectAllVisible(): void {
    const set = new Set<number>();
    this.users().forEach((u) => set.add(u.id));
    this.selectedUserIds.set(set);
  }

  // Modals: Create User
  openCreateModal(): void {
    this.createForm = {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      userName: '',
      password: '',
      phoneNumber: '',
      role: 'User',
      isActive: true
    };
    this.modalError.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.modalError.set(null);
  }

  submitCreateUser(): void {
    if (!this.createForm.firstName.trim() || !this.createForm.lastName.trim()) {
      this.modalError.set('First name and last name are required.');
      return;
    }
    if (!this.createForm.email.trim()) {
      this.modalError.set('Valid email address is required.');
      return;
    }
    if (!this.createForm.userName.trim()) {
      this.modalError.set('Username is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.modalError.set(null);

    const payload: CreateUserPayload = {
      ...this.createForm,
      firstName: this.createForm.firstName.trim(),
      lastName: this.createForm.lastName.trim(),
      displayName: this.createForm.displayName?.trim() || `${this.createForm.firstName.trim()} ${this.createForm.lastName.trim()}`,
      email: this.createForm.email.trim(),
      userName: this.createForm.userName.trim(),
      role: this.createForm.role || 'User'
    };

    this.userManagementService.createUser(payload).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.showToast(`User ${created.displayName} created successfully.`, 'success');
        this.loadUsers();
        this.loadStatistics();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to create user. Ensure email and username are unique.';
        this.modalError.set(msg);
      }
    });
  }

  // Modals: Edit User
  openEditModal(user: UserItem): void {
    this.selectedUserForEdit.set(user);
    this.editForm = {
      id: user.id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      isActive: user.isActive,
      password: ''
    };
    this.modalError.set(null);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedUserForEdit.set(null);
    this.modalError.set(null);
  }

  submitEditUser(): void {
    if (!this.editForm.firstName.trim() || !this.editForm.lastName.trim()) {
      this.modalError.set('First name and last name are required.');
      return;
    }
    if (!this.editForm.email.trim()) {
      this.modalError.set('Valid email address is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.modalError.set(null);

    const payload: UpdateUserPayload = {
      firstName: this.editForm.firstName.trim(),
      lastName: this.editForm.lastName.trim(),
      displayName: this.editForm.displayName?.trim() || `${this.editForm.firstName.trim()} ${this.editForm.lastName.trim()}`,
      email: this.editForm.email.trim(),
      phoneNumber: this.editForm.phoneNumber?.trim() || undefined,
      role: this.editForm.role,
      isActive: this.editForm.isActive,
      password: this.editForm.password?.trim() ? this.editForm.password.trim() : undefined
    };

    this.userManagementService.updateUser(this.editForm.id, payload).subscribe({
      next: (updated) => {
        this.isSubmitting.set(false);
        this.closeEditModal();
        this.showToast(`User ${updated.displayName} updated successfully.`, 'success');
        this.loadUsers();
        this.loadStatistics();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to update user.';
        this.modalError.set(msg);
      }
    });
  }

  // Modals: Delete User (Soft Delete)
  openDeleteModal(user: UserItem): void {
    this.selectedUserForDelete.set(user);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedUserForDelete.set(null);
  }

  confirmSoftDelete(): void {
    const user = this.selectedUserForDelete();
    if (!user) return;

    this.isSubmitting.set(true);
    this.userManagementService.deleteUser(user.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDeleteModal();
        this.showToast(`User ${user.displayName} soft-deleted. Data preserved.`, 'info');
        this.loadUsers();
        this.loadStatistics();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.showToast(err.error?.message || 'Failed to delete user.', 'error');
      }
    });
  }

  // Restore user
  restoreUser(user: UserItem): void {
    this.userManagementService.restoreUser(user.id).subscribe({
      next: () => {
        this.showToast(`User ${user.displayName} restored successfully.`, 'success');
        this.loadUsers();
        this.loadStatistics();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to restore user.', 'error');
      }
    });
  }

  // Toggle active status
  toggleUserStatus(user: UserItem): void {
    const newStatus = !user.isActive;
    this.userManagementService.updateStatus(user.id, newStatus).subscribe({
      next: () => {
        this.showToast(`User ${user.displayName} marked as ${newStatus ? 'Active' : 'Inactive'}.`, 'info');
        this.loadUsers();
        this.loadStatistics();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Failed to update user status.', 'error');
      }
    });
  }

  // Helpers
  getUserInitials(user: UserItem): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.displayName.slice(0, 2).toUpperCase();
    }
    return 'U';
  }

  getAvatarColor(role: string): { bg: string; text: string } {
    if (role === 'Admin') {
      return { bg: 'bg-[#e2dfff]', text: 'text-[#3323cc]' };
    }
    return { bg: 'bg-[#d8e2ff]', text: 'text-[#004395]' };
  }

  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.showToast(`Copied "${text}" to clipboard`, 'info');
    }
  }

  exportCsv(): void {
    const selected = this.selectedUserIds();
    const allUsers = this.users();
    const items = selected.size > 0
      ? allUsers.filter((u) => selected.has(u.id))
      : allUsers;

    if (items.length === 0) {
      this.showToast('No user data to export.', 'info');
      return;
    }

    const headers = ['ID', 'First Name', 'Last Name', 'Display Name', 'Email', 'Username', 'Phone', 'Role', 'Status', 'Is Deleted', 'Created At'];
    const rows = items.map((u) => [
      u.id,
      `"${(u.firstName || '').replace(/"/g, '""')}"`,
      `"${(u.lastName || '').replace(/"/g, '""')}"`,
      `"${(u.displayName || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.userName || '').replace(/"/g, '""')}"`,
      `"${(u.phoneNumber || '').replace(/"/g, '""')}"`,
      u.role,
      u.isDeleted ? 'Deleted' : u.isActive ? 'Active' : 'Inactive',
      u.isDeleted ? 'Yes' : 'No',
      u.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quizzo_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const countMsg = selected.size > 0 ? `${items.length} selected user(s)` : `${items.length} user(s)`;
    this.showToast(`Exported ${countMsg} to CSV successfully.`, 'success');
  }

  showToast(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
