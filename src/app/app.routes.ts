import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminOverviewComponent } from './pages/admin/admin-overview.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminOverviewComponent, pathMatch: 'full' },
      { path: 'overview', redirectTo: '', pathMatch: 'full' },
      { path: 'user-management', component: AdminOverviewComponent },
      { path: 'quiz-and-deck-studio', component: AdminOverviewComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
