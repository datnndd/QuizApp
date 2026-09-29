# Quizzo — Active Recall & Quiz Sprint Platform

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Angular 19](https://img.shields.io/badge/Angular-19-DD0031?logo=angular)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![SQL Server](https://img.shields.io/badge/Database-SQL_Server-CC292B?logo=microsoft-sql-server)](https://www.microsoft.com/sql-server)
[![Tests](https://img.shields.io/badge/Tests-111%20Passed-brightgreen)](https://github.com/)

**Quizzo** is a modern, high-performance web platform designed for active recall learning, timed quiz sprints, question bank reuse, and comprehensive assessment management. It features a tactile neo-brutalist user interface powered by Angular 19 and Tailwind CSS, backed by a robust ASP.NET Core Web API with Entity Framework Core and SQL Server.

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
  - [1. Timed Quiz Sprint Player](#1-timed-quiz-sprint-player)
  - [2. Master-Detail Quiz Studio](#2-master-detail-quiz-studio)
  - [3. Question Bank & Smart Cloning](#3-question-bank--smart-cloning)
  - [4. Inline Category Management](#4-inline-category-management)
  - [5. Student Dashboard & Recent Quizzes Ledger](#5-student-dashboard--recent-quizzes-ledger)
  - [6. Admin Management Suite](#6-admin-management-suite)
  - [7. User Profile & Account Settings](#7-user-profile--account-settings)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup (.NET 10 Web API)](#2-backend-setup-net-10-web-api)
  - [3. Frontend Setup (Angular 19)](#3-frontend-setup-angular-19)
- [Default Seed Accounts & Credentials](#default-seed-accounts--credentials)
- [API Documentation](#api-documentation)
- [Automated Testing & Quality Verification](#automated-testing--quality-verification)
- [Repository Structure](#repository-structure)
- [License](#license)

---

## Architectural Overview

Quizzo adopts a decoupled, modern client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Angular 19 Client (QuizFE)                  │
│   • Neo-Brutalist Tactile Design (Tailwind CSS)             │
│   • Standalone Components & Angular Signals                 │
│   • Auth Interceptor, Guards & Error Handling               │
│   • Port: http://localhost:4200                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST via HTTP & JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             ASP.NET Core 10 Web API (QuizApi)               │
│   • RESTful Controllers & Domain DTOs                       │
│   • JWT Bearer Authentication & Claims-based Auth           │
│   • EF Core 10 ORM with Code-First Migrations               │
│   • Background Worker: ExpiredAttemptSubmissionService      │
│   • Interactive OpenAPI & Scalar API Reference              │
│   • Port: http://localhost:5255 | https://localhost:7256    │
└──────────────────────────────┬──────────────────────────────┘
                               │ ADO.NET / EF Core
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Microsoft SQL Server (QuizDb)                  │
│   • Users, Roles, UserRoles (BCrypt Hashing)                │
│   • Quizzes, Categories, Questions, QuestionVersions        │
│   • QuizQuestions, QuizAttempts, UserAnswers                │
│   • Full Relational Constraints & Auditing Columns          │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
- **Framework**: [.NET 10](https://dotnet.microsoft.com/) / ASP.NET Core Web API
- **Data Access**: [Entity Framework Core 10](https://learn.microsoft.com/ef/core/) with SQL Server Provider
- **Database**: Microsoft SQL Server / LocalDB / SQL Server Express
- **Security**: JWT Bearer Tokens (`Microsoft.AspNetCore.Authentication.JwtBearer`), BCrypt.Net Password Hashing
- **API Documentation**: Microsoft OpenAPI (`AddOpenApi`) & [Scalar API Reference](https://scalar.com/)
- **Background Tasks**: ASP.NET Core `IHostedService` for auto-submitting expired quiz attempts
- **Testing**: xUnit, FluentAssertions, Moq, EF Core InMemory Provider

### Frontend
- **Framework**: [Angular 19](https://angular.dev/) (Standalone Components, Signals, `toSignal`, inject API)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom neo-brutalist tactile theme tokens (`#faf8f5` canvas, `#1e1b18` dark elements, `#272421` borders, tactile shadows)
- **Icons**: Lucide Angular / Inline SVG design primitives
- **HTTP Client**: Angular `provideHttpClient` with functional `authInterceptor`
- **Testing**: [Vitest](https://vitest.dev/) via `@angular/build` test runner (16 test suites, 98 unit tests)

---

## Key Features

### 1. Timed Quiz Sprint Player
- **Split-Workstation UX**: Focus-first layout with real-time countdown timer, progress bar, question jump drawer, and bookmarking.
- **Auto-Save & Resiliency**: Automatic progress synchronization (`/api/quizattempts/{id}/save-progress`) after each answered question.
- **Server-Enforced Expiration**: Background hosted service (`ExpiredAttemptSubmissionService`) periodically marks overdue attempts as submitted, preventing timer tampering.
- **Instant Detailed Review**: Comprehensive results breakdown showing overall score, accuracy percentage, time spent, question-by-question explanations, and correct answer highlights.

### 2. Master-Detail Quiz Studio
- **Master-Detail Flow**: Side-by-side index list and active question editor for seamless authoring.
- **Rich Question Editing**: Multiple-choice (single and multi-select) and True/False questions with points, custom explanations, and dynamic option ordering.
- **Question Duplication**: 1-click in-place duplication of existing questions within the current draft.
- **Validation**: Enforces valid correct answer selection, non-empty options, and required metadata before saving.

### 3. Question Bank & Smart Cloning
- **Global & Personal Banks**: Search questions across public quizzes or personal collections.
- **Answer Previews**: Expandable answer accordions with visual correct-answer checkmarks directly inside the bank modal.
- **Deep-Cloned Import**: 1-click single import or bulk selection cloning. Imported questions receive new unique IDs and decoupled answer sets, ensuring edits in the quiz never mutate the original bank questions.
- **Context-Aware Pre-Filtering**: Automatically filters available questions by the quiz's category upon opening.

### 4. Inline Category Management
- **Immediate Taxonomy Creation**: Create new categories directly from the quiz creation/edit screen without leaving the editor.
- **Instant Selection**: New categories are automatically saved via `POST /api/categories`, added to the global taxonomy list, and pre-selected in the active quiz.

### 5. Student Dashboard & Recent Quizzes Ledger
- **Activity Metrics**: Total quizzes completed, average accuracy rate, total study time, and learning streak.
- **Ledger Views**: Filterable history of past attempts categorized by status (`In Progress`, `Completed`, `Abandoned`).
- **One-Click Resume**: Re-enter unexpired attempts directly from the dashboard or recent attempts ledger.

### 6. Admin Management Suite
- **Role-Based Protection**: Secured by client-side `AdminGuard` and backend `[Authorize(Roles = "Admin")]` policies.
- **Quick Switch**: Visible "Switch to Admin Page" quick action button in Navbar, Dashboard, and Settings for authenticated administrators.
- **User Moderation**: Paginated user management table with search, role filters, activation/deactivation, soft deletion, and account restoration.
- **Quiz Moderation**: Global quiz registry with visibility toggles (Public/Private), search, category filters, and detailed attempt metrics.

### 7. User Profile & Account Settings
- **Profile Customization**: Update first name, last name, display name, phone number, and avatar URL.
- **Security Center**: Change account password with current-password verification and BCrypt re-hashing.

---

## Prerequisites

Ensure you have the following installed on your machine:
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) (or latest .NET SDK supporting C# 13 / net10.0)
- [Node.js](https://nodejs.org/) (v20.x or v22.x LTS recommended)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- [Microsoft SQL Server](https://www.microsoft.com/sql-server) (SQL Server Express or LocalDB)
  - Default connection string targets: `Server=.\\SQLEXPRESS;Database=QuizDb;Trusted_Connection=True;TrustServerCertificate=True`

---

## Quick Start Guide

### 1. Clone Repository

```bash
git clone https://github.com/datnndd/QuizApp.git
cd QuizApp
```

---

### 2. Backend Setup (.NET 10 Web API)

1. **Navigate to the API directory**:
   ```bash
   cd QuizApi/QuizApi
   ```

2. **Configure Database Connection** (Optional):
   Inspect `appsettings.json` and adjust `ConnectionStrings:DefaultConnection` if your SQL Server instance differs from `Server=.\\SQLEXPRESS`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=.\\SQLEXPRESS;Database=QuizDb;Trusted_Connection=True;TrustServerCertificate=True"
   }
   ```

3. **Apply Database Migrations & Seed Data**:
   Database migrations and role/user/quiz seed scripts execute automatically upon application startup via `DbInitializer.InitializeAsync()`. If you prefer to apply migrations manually via EF CLI:
   ```bash
   dotnet ef database update
   ```

4. **Run the Backend API**:
   ```bash
   dotnet run
   ```
   - **HTTP Endpoint**: `http://localhost:5255`
   - **HTTPS Endpoint**: `https://localhost:7256`
   - **Interactive API Documentation (Scalar)**: `http://localhost:5255/scalar/v1`
   - **OpenAPI Schema**: `http://localhost:5255/openapi/v1.json`

---

### 3. Frontend Setup (Angular 19)

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd QuizFE
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```
   *(Or `ng serve`)*

4. **Access the Application**:
   Open your browser and navigate to `http://localhost:4200`.

---

## Default Seed Accounts & Credentials

The database seeder automatically creates roles and test accounts on first run:

| Role | Username / Identifier | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@quizzo.com` | `Admin@123456` | Master Administrator (Alex Morgan) |
| **Admin** | `sjenkins` | `s.jenkins@oxford.ac.uk` | `Admin@123456` | Content Lead Admin (Sarah Jenkins) |
| **Admin** | `mchen` | `marcus.c@stanford.edu` | `Admin@123456` | Author Admin (Marcus Chen) |
| **Admin** | `nguyendoandatada` | `nguyendoandatada@gmail.com` | `Admin@123456` | Designated Super Admin |
| **User** | `erostova` | `elena.rostova@mit.edu` | `User@123456` | Standard Student (Elena Rostova) |
| **User** | `czhao` | `chloe.z@nyu.edu` | `User@123456` | Standard Student (Chloe Zhao) |
| **User** | `jwilson` | `j.wilson@columbia.edu` | `User@123456` | Standard Student (James Wilson) |

> **Note**: Any newly registered user defaults to the `User` role.

---

## API Documentation

When the backend runs in `Development` mode, interactive documentation is accessible at:
- **Scalar API Interface**: `http://localhost:5255/scalar/v1`

### Key Endpoint Groups

| Group | Method | Route | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register new student user |
| | `POST` | `/api/auth/login` | Authenticate user & receive JWT token |
| | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| | `PUT` | `/api/auth/profile` | Update profile information |
| | `POST` | `/api/auth/change-password` | Update account password |
| **Categories** | `GET` | `/api/categories` | List all available categories |
| | `POST` | `/api/categories` | Create a new quiz category |
| **Quizzes** | `GET` | `/api/quizzes/explore` | Browse public quizzes with filters & pagination |
| | `GET` | `/api/quizzes/mine` | List quizzes authored by current user |
| | `GET` | `/api/quizzes/{id}` | Retrieve full quiz details and questions |
| | `POST` | `/api/quizzes` | Create a new quiz draft |
| | `PUT` | `/api/quizzes/{id}` | Update quiz (preserves attempt history via versioning) |
| | `DELETE` | `/api/quizzes/{id}` | Delete a quiz |
| | `PATCH` | `/api/quizzes/{id}/visibility` | Toggle public/private visibility |
| **Questions** | `GET` | `/api/questions/explore` | Search Question Bank |
| | `GET` | `/api/questions/mine` | List questions authored by current user |
| | `GET` | `/api/questions/{id}` | Retrieve question details and answers |
| **Quiz Attempts** | `POST` | `/api/quizattempts/start` | Start a new timed quiz attempt |
| | `POST` | `/api/quizattempts/{id}/save-progress` | Save real-time answers & elapsed time |
| | `POST` | `/api/quizattempts/{id}/submit` | Submit attempt & compute score |
| | `GET` | `/api/quizattempts/recent` | List user's recent attempts |
| | `GET` | `/api/quizattempts/{id}` | Review completed attempt with explanations |
| **Admin** | `GET` | `/api/users` | List users with pagination and filters |
| | `GET` | `/api/users/stats` | Retrieve platform-wide user analytics |
| | `PATCH` | `/api/users/{id}/status` | Activate or deactivate user |
| | `DELETE` | `/api/users/{id}` | Soft-delete a user account |
| | `POST` | `/api/users/{id}/restore` | Restore soft-deleted user account |

---

## Automated Testing & Quality Verification

Quizzo maintains comprehensive automated test suites for both backend and frontend layers:

### Running Backend Unit & Integration Tests (xUnit)
```bash
# From repository root
dotnet test QuizApi/QuizApi.slnx
```
- **Test Project**: `QuizApi.Tests`
- **Coverage**: `CategoriesControllerTests`, `QuizzesControllerTests`, `QuizAttemptsControllerTests`, `QuizAttemptServiceTests`
- **Result**: 13 of 13 tests passing.

### Running Frontend Unit Tests (Vitest)
```bash
# From repository root or QuizFE directory
cd QuizFE
npm test -- --watch=false
```
- **Test Runner**: Vitest with `@angular/build:application`
- **Coverage**: 16 test suites covering all pages (`admin-overview`, `quiz-management`, `user-management`, `edit-quiz`, `quiz-player`, `dashboard`, `settings`, `explore`, `recent-quizzes`, `my-decks`, `landing`, `login`, `register`, `navbar`, `admin.guard`).
- **Result**: 98 of 98 unit tests passing.

### Verifying Frontend Production Build
```bash
cd QuizFE
npm run build
```
- Compiles the Angular application for production into `QuizFE/dist/QuizFE`.

---

## Repository Structure

```
├── QuizApi/                           # ASP.NET Core Backend Solution
│   ├── QuizApi/                       # Web API Project (.NET 10)
│   │   ├── Controllers/               # RESTful API Controllers
│   │   ├── Data/                      # EF Core AppDbContext & DbInitializer
│   │   ├── DTOs/                      # Data Transfer Objects
│   │   ├── Extensions/                # Service Registration & Middleware Extensions
│   │   ├── Migrations/                # EF Core Database Migrations
│   │   ├── Models/                    # Domain Entities (Quiz, Question, User, etc.)
│   │   ├── Services/                  # Business Logic & Background Hosted Services
│   │   ├── appsettings.json           # Configuration (Connection Strings, JWT)
│   │   └── Program.cs                 # API Entry Point & Dependency Injection
│   └── QuizApi.slnx                   # .NET Solution File
├── QuizApi.Tests/                     # Backend xUnit Test Project
├── QuizFE/                            # Angular 19 Standalone Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                  # Guards, Interceptors, Models, Services
│   │   │   │   ├── guards/            # AdminGuard & AuthGuard
│   │   │   │   ├── interceptors/      # AuthInterceptor (JWT attachment)
│   │   │   │   ├── models/            # TypeScript Interfaces & Enums
│   │   │   │   └── services/          # AuthService, QuizService, UserService
│   │   │   ├── pages/                 # Routed Application Views
│   │   │   │   ├── admin/             # Admin Overview, Quiz & User Management
│   │   │   │   ├── dashboard/         # Student Dashboard with quick stats
│   │   │   │   ├── edit-quiz/         # Master-Detail Quiz Editor & Question Bank Modal
│   │   │   │   ├── explore/           # Explore Public Quizzes
│   │   │   │   ├── landing/           # Neo-Brutalist Landing Page
│   │   │   │   ├── login/ & register/ # Authentication Forms
│   │   │   │   ├── my-decks/          # Created Quiz Management
│   │   │   │   ├── quiz-player/       # Timed Split Workstation & Result Review
│   │   │   │   ├── recent-quizzes/    # Past Attempts Ledger
│   │   │   │   └── settings/          # Profile & Password Management
│   │   │   └── shared/                # Navbar, Header & Reusable Components
│   │   └── environments/              # API Environment Endpoints
│   ├── tailwind.config.js             # Tailwind Neo-Brutalist Theme Tokens
│   └── package.json                   # Frontend Dependencies & Scripts
├── stitch_exports/                    # Visual Prototypes & UI Export References
├── QUIZ_MODULE_REQUIREMENTS.md        # Detailed Domain & Functional Specification
└── README.md                          # Repository Documentation (This file)
```

---

## License

This project was developed for educational and technical assessment purposes. All rights reserved.
