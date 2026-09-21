import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface AdminKpi {
  id: string;
  title: string;
  value: string;
  badgeText?: string;
  badgeClass?: string;
  subtext: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  trendText?: string;
  trendPeriod?: string;
  metricType?: 'users' | 'decks' | 'sprints' | 'queue';
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  role: string;
  roleCategory: 'students' | 'educators' | 'admins';
  academy: string;
  metricLabel: string;
  metricDetail?: string;
  progressPercent?: number;
  accessState: string;
  accessBadgeClass: string;
}

export interface AdminQuizCard {
  id: string;
  title: string;
  domain: 'astrophysics' | 'cs' | 'medicine' | 'geography';
  domainLabel: string;
  questionsCount: number;
  statusBadge: string;
  statusBadgeClass: string;
  statusIcon?: string;
  runsText: string;
  subDetail: string;
  isPendingApproval?: boolean;
}

export interface AuditItem {
  id: string;
  message: string;
  timestamp: string;
  dotColorClass: string;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.css'
})
export class AdminOverviewComponent {
  private readonly authService = inject(AuthService);

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

  // State Signals
  readonly timeframe = signal<'today' | '7days' | 'month'>('today');
  readonly userFilter = signal<'all' | 'students' | 'educators' | 'admins'>('all');
  readonly userSearchQuery = signal<string>('');
  readonly quizDomain = signal<'all' | 'astrophysics' | 'cs' | 'medicine' | 'geography'>('all');
  readonly quizSearchQuery = signal<string>('');

  // KPIs
  readonly kpis = signal<AdminKpi[]>([
    {
      id: 'kpi-users',
      title: 'Total Registered Users',
      value: '54,820',
      subtext: '+8.4% month',
      trendText: '+312 today',
      icon: 'group',
      iconBgClass: 'bg-[#e2dfff]',
      iconColorClass: 'text-[#3525cd]',
      metricType: 'users'
    },
    {
      id: 'kpi-decks',
      title: 'Active Curated Decks',
      value: '3,420',
      subtext: 'Verified live status across production nodes',
      icon: 'collections_bookmark',
      iconBgClass: 'bg-[#e2e7ff]',
      iconColorClass: 'text-[#2170e4]',
      metricType: 'decks'
    },
    {
      id: 'kpi-sprints',
      title: 'Daily Quiz Sprints',
      value: '18,940',
      subtext: 'Median completion time: 3m 42s',
      icon: 'bolt',
      iconBgClass: 'bg-[#ffddb8]',
      iconColorClass: 'text-[#684000]',
      metricType: 'sprints'
    },
    {
      id: 'kpi-queue',
      title: 'Verification Queue',
      value: '14',
      badgeText: 'Action Required',
      subtext: 'Oldest waiting item: 4.2 hrs ago',
      icon: 'gavel',
      iconBgClass: 'bg-[#ffdad6]',
      iconColorClass: 'text-[#ba1a1a]',
      metricType: 'queue'
    }
  ]);

  // User Directory Data
  readonly users = signal<AdminUserRow[]>([
    {
      id: 'usr-1',
      name: 'Alex Morgan',
      email: 'alex.morgan@stanford.edu',
      initials: 'AM',
      avatarBg: 'bg-[#e2dfff]',
      avatarColor: 'text-[#3525cd]',
      role: 'Student · Lvl 14',
      roleCategory: 'students',
      academy: 'Stanford University',
      metricLabel: '18 Decks Completed',
      metricDetail: '96% ret.',
      progressPercent: 96,
      accessState: 'Active',
      accessBadgeClass: 'bg-[#d8e2ff] text-[#001a42]'
    },
    {
      id: 'usr-2',
      name: 'Dr. Elena Rostova',
      email: 'elena.rostova@mit.edu',
      initials: 'ER',
      avatarBg: 'bg-[#ffddb8]',
      avatarColor: 'text-[#684000]',
      role: 'Lead Educator',
      roleCategory: 'educators',
      academy: 'MIT Media Lab',
      metricLabel: '42 Decks Authored',
      metricDetail: '34.1k total attempts',
      accessState: 'Verified Auth',
      accessBadgeClass: 'bg-[#e2dfff] text-[#3323cc]'
    },
    {
      id: 'usr-3',
      name: 'Marcus Chen',
      email: 'marcus.c@stanford.edu',
      initials: 'MC',
      avatarBg: 'bg-[#dae2fd]',
      avatarColor: 'text-[#464555]',
      role: 'Curator Lead',
      roleCategory: 'admins',
      academy: 'Stanford AI & CS',
      metricLabel: '120 Quizzes Audited',
      metricDetail: 'Avg review: 18 min',
      accessState: 'Active',
      accessBadgeClass: 'bg-[#d8e2ff] text-[#001a42]'
    },
    {
      id: 'usr-4',
      name: 'Sarah Jenkins',
      email: 's.jenkins@oxford.ac.uk',
      initials: 'SJ',
      avatarBg: 'bg-[#4f46e5]',
      avatarColor: 'text-white',
      role: 'Super Admin',
      roleCategory: 'admins',
      academy: 'Univ of Oxford',
      metricLabel: 'Root Access Node',
      metricDetail: 'Last login: 12 min ago',
      accessState: 'MFA Active',
      accessBadgeClass: 'bg-[#eaedff] text-[#464555]'
    }
  ]);

  // Quiz Studio Data
  readonly quizzes = signal<AdminQuizCard[]>([
    {
      id: 'q-1',
      title: 'Solar System Mechanics & Deep Space',
      domain: 'astrophysics',
      domainLabel: 'Astrophysics',
      questionsCount: 10,
      statusBadge: 'Sign-off Needed',
      statusBadgeClass: 'bg-[#ffddb8] text-[#653e00]',
      statusIcon: 'pending_actions',
      runsText: '8,620 plays (Beta)',
      subDetail: 'Submitted 2h ago by Dr. Rostova',
      isPendingApproval: true
    },
    {
      id: 'q-2',
      title: 'Modern Web Architecture & CSS',
      domain: 'cs',
      domainLabel: 'Computer Science',
      questionsCount: 12,
      statusBadge: 'Published Live',
      statusBadgeClass: 'bg-[#d8e2ff] text-[#004395]',
      runsText: '11,850 runs this week',
      subDetail: 'Passing Rate: 84.2%',
      isPendingApproval: false
    },
    {
      id: 'q-3',
      title: 'World Capitals & Geopolitical Borders',
      domain: 'geography',
      domainLabel: 'Geography',
      questionsCount: 10,
      statusBadge: 'Published Live',
      statusBadgeClass: 'bg-[#d8e2ff] text-[#004395]',
      runsText: '14,200 runs',
      subDetail: 'Flag count: 0 (Clean)',
      isPendingApproval: false
    }
  ]);

  // Audit stream
  readonly auditStream = signal<AuditItem[]>([
    {
      id: 'aud-1',
      message: 'Dr. Rostova published deck #4091 (Solar System)',
      timestamp: '2m ago',
      dotColorClass: 'bg-[#0058be]'
    },
    {
      id: 'aud-2',
      message: 'Alex Morgan streak shield restored manually',
      timestamp: '14m ago',
      dotColorClass: 'bg-[#684000]'
    },
    {
      id: 'aud-3',
      message: 'Automated fact-checker resolved claim on Q#8942',
      timestamp: '28m ago',
      dotColorClass: 'bg-[#3525cd]'
    }
  ]);

  // Computed Filtered Lists
  readonly filteredUsers = computed(() => {
    const filter = this.userFilter();
    const query = this.userSearchQuery().toLowerCase().trim();

    return this.users().filter((user) => {
      const matchesFilter = filter === 'all' || user.roleCategory === filter;
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.academy.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  });

  readonly filteredQuizzes = computed(() => {
    const domain = this.quizDomain();
    const query = this.quizSearchQuery().toLowerCase().trim();

    return this.quizzes().filter((quiz) => {
      const matchesDomain = domain === 'all' || quiz.domain === domain;
      const matchesQuery =
        !query ||
        quiz.title.toLowerCase().includes(query) ||
        quiz.domainLabel.toLowerCase().includes(query);
      return matchesDomain && matchesQuery;
    });
  });

  setTimeframe(tf: 'today' | '7days' | 'month'): void {
    this.timeframe.set(tf);
  }

  setUserFilter(filter: 'all' | 'students' | 'educators' | 'admins'): void {
    this.userFilter.set(filter);
  }

  setQuizDomain(domain: 'all' | 'astrophysics' | 'cs' | 'medicine' | 'geography'): void {
    this.quizDomain.set(domain);
  }

  approveDeck(deckId: string): void {
    this.quizzes.update((decks) =>
      decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              isPendingApproval: false,
              statusBadge: 'Published Live',
              statusBadgeClass: 'bg-[#d8e2ff] text-[#004395]',
              statusIcon: undefined
            }
          : d
      )
    );
  }

  logout(): void {
    this.authService.logout();
  }
}
