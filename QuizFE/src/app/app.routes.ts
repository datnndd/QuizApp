import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ExploreComponent } from './pages/explore/explore.component';
import { RecentQuizzesComponent } from './pages/recent-quizzes/recent-quizzes.component';
import { MyDecksComponent } from './pages/my-decks/my-decks.component';
import { QuizPlayerComponent } from './pages/quiz-player/quiz-player.component';
import { EditQuizComponent } from './pages/edit-quiz/edit-quiz.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AdminOverviewComponent } from './pages/admin/admin-overview.component';
import { UserManagementComponent } from './pages/admin/user-management.component';
import { AdminQuizManagementComponent } from './pages/admin/quiz-management.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LandingComponent },
  { path: 'register', component: LandingComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'explore', component: ExploreComponent },
  { path: 'recent-quizzes', component: RecentQuizzesComponent },
  { path: 'my-decks', component: MyDecksComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'quiz/play/:id', component: QuizPlayerComponent },
  { path: 'quiz/play', component: QuizPlayerComponent },
  { path: 'quiz/edit/:id', component: EditQuizComponent },
  { path: 'quiz/new', component: EditQuizComponent },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminOverviewComponent, pathMatch: 'full' },
      { path: 'overview', redirectTo: '', pathMatch: 'full' },
      { path: 'user-management', component: UserManagementComponent },
      { path: 'quiz-management', component: AdminQuizManagementComponent },
      { path: 'quiz-and-deck-studio', redirectTo: 'quiz-management', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
