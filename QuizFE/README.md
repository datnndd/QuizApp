# QuizFE — Frontend Application

This directory contains the Angular frontend client for **Quizzo**, an active recall learning and quiz sprint platform.

The UI is built with Angular standalone components and signals reactivity, styled with a warm neo-brutalist tactile aesthetic powered by Tailwind CSS, and tested using Vitest.

> For full system documentation (architecture, backend setup, database, seed accounts, and API reference), please refer to the [Root README](../README.md).

---

## Tech Stack & Architecture

- **Framework**: Angular 19+ (Standalone Components, Signals, `toSignal`, inject API)
- **Styling**: Tailwind CSS with custom tactile neo-brutalist design tokens:
  - Base canvas: `#faf8f5` (warm cream)
  - Dark foreground: `#1e1b18`
  - Tactile borders: `border-2 border-[#272421]`
  - Tactile shadows: `shadow-tactile` (`3px 3px 0px #272421`), `shadow-tactile-sm`, `shadow-tactile-lg`
  - Brand accents: Warm Amber (`#d97706`, `#b45309`) and Spiced Terracotta
- **State & Reactivity**: Angular Signals (`signal`, `computed`, `effect`)
- **HTTP & Authentication**: Angular `provideHttpClient` with functional `authInterceptor` adding JWT Bearer authorization headers
- **Routing & Protection**: Angular Router with lazy route loading and `AdminGuard` role protection
- **Test Runner**: [Vitest](https://vitest.dev/) via `@angular/build:application`

---

## Directory Structure

```
QuizFE/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/          # Route protection guards (AdminGuard)
│   │   │   ├── interceptors/    # Functional HTTP interceptors (authInterceptor)
│   │   │   ├── models/          # TypeScript interfaces (Quiz, Question, User, Attempt)
│   │   │   └── services/        # Singleton services (AuthService, QuizService, UserService)
│   │   ├── pages/               # Feature route views
│   │   │   ├── admin/           # Admin Overview, Quiz & User Management
│   │   │   ├── dashboard/       # Student dashboard with metrics and recent history
│   │   │   ├── edit-quiz/       # Master-detail quiz authoring & Question Bank modal
│   │   │   ├── explore/         # Public quiz catalog with search and filters
│   │   │   ├── landing/         # Neo-brutalist landing page
│   │   │   ├── login/           # Authentication login page
│   │   │   ├── register/        # Student registration page
│   │   │   ├── my-decks/        # Quizzes created by the authenticated user
│   │   │   ├── quiz-player/     # Timed quiz player & detailed result review
│   │   │   ├── recent-quizzes/  # Past attempts ledger
│   │   │   └── settings/        # User profile & password management
│   │   ├── shared/              # Reusable shared components
│   │   │   ├── navbar/          # Global navigation bar with user dropdown
│   │   │   └── player-header/   # Header used during quiz sprint sessions
│   │   ├── app.component.ts     # Root shell component
│   │   ├── app.config.ts        # Application configuration & providers
│   │   └── app.routes.ts        # Route definitions
│   ├── environments/            # Environment configurations (API URL)
│   ├── styles.css               # Global styles & Tailwind utilities
│   └── index.html               # Main HTML entry point
├── angular.json                 # Angular CLI workspace configuration
├── package.json                 # Dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
└── vitest.config.ts             # Vitest test configuration
```

---

## Development Workflow

### Prerequisites
- Node.js 20.x or 22.x LTS
- npm 10.x or higher

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
```bash
npm start
# or: ng serve
```
Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Configuration
By default, the frontend connects to the ASP.NET Core API at `http://localhost:5255/api`. This can be customized in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5255/api'
};
```

---

## Running Automated Tests

Run all unit tests using the Vitest test runner:

```bash
npm test -- --watch=false
```

To run tests in watch mode during development:
```bash
npm test
```

### Test Coverage Highlights
- **Total Test Suites**: 16 passed
- **Total Unit Tests**: 98 passed
- **Features Tested**:
  - `edit-quiz.component.spec.ts`: Master-detail question management, dynamic category creation, question bank search and filtering, answer previews, and single/bulk deep-cloned question imports.
  - `user-management.component.spec.ts`: Admin user listing, filtering, role toggle, soft-delete, and restoration.
  - `admin-overview.component.spec.ts` & `quiz-management.component.spec.ts`: Platform metrics and quiz moderation.
  - `dashboard.component.spec.ts`: Stat cards, active attempt resuming, and admin switch button.
  - `quiz-player.component.spec.ts`: Timer countdown, answer selection, autosave progress, and instant score review.
  - `settings.component.spec.ts`: Profile update form and password change validation.
  - `admin.guard.spec.ts`: Access control and unauthorized redirection.

---

## Production Build

To build the project for production:

```bash
npm run build
```

Build artifacts will be compiled into the `dist/QuizFE` directory.
