# Resourcivo

**A college resource management platform**: one place for academics, the library, inventory and labs, campus transport, people directories and notifications, with role-based access for admins, faculty, students, librarians and transport managers.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-7-646CFF)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1)

<!-- Add screenshots here, e.g. docs/screenshots/dashboard.png -->

---

## Table of contents

- [Features](#features)
- [Roles and permissions](#roles-and-permissions)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Testing](#testing)
- [Known limitations](#known-limitations)

---

## Features

### Authentication and accounts
- Registration (student or faculty) with first and last name
- **Email verification** before first login, with a resend option
- JWT login (30-minute tokens) with automatic **token refresh** in the browser
- Forgot / reset password by email, and change password
- Admin-created **staff accounts** (librarian, transport manager) with a one-time temporary password the user must change at first sign-in

### Profiles
- Student, faculty, librarian and transport-manager profiles, each editable through a `/me` endpoint
- An admin-created student or faculty record is **claimed automatically** when its contact email matches the verified account email
- **Profile pictures**: cropped and resized in the browser, stored in the database (JPEG, PNG or WebP, up to 2 MB, file type checked from the file's bytes)
- Emergency contacts for students, with ownership checks

### Academic
- Courses, subjects, students and faculty management
- Faculty subject selection from a dropdown, with an "Other" option
- Search with filters, plus optional paging and sorting (`page`, `size`, `sortBy`, `direction`)

### Resource center
- **Library**: libraries with a librarian in charge, books and categories, borrow requests, approvals, returns, renewals, cancellations, issue history and overdue tracking
- **Inventory**: items with categories and units of measure, plus a low-stock view
- **Lab equipment**: lab types, equipment status and a maintenance-due view
- **Classrooms**: management and an availability view

### Transport
- Vehicles with routes, seats and an active / inactive status
- Seat booking and cancellation for students and faculty
- Deactivating a vehicle **cancels all of its active bookings**, frees the seats and notifies the affected users and managers

### Directory
- A searchable directory of students and faculty (with profile pictures), plus contacts and addresses

### Notifications
- In-app bell with an unread badge, refreshed every 30 seconds and when the tab regains focus
- Event-driven notifications: booking changes, book request decisions, return confirmations, new librarian requests, new verified users for admins, role changes, password changes and more
- A daily job at 09:00 (server time) sends due-tomorrow and overdue reminders and removes notifications older than 90 days

### Admin
- Staff account creation, user list, enable / disable users, and role management
- Libraries, directory and dashboard summaries

### Security
- Spring Security with stateless JWT authentication and BCrypt password hashing
- Role-based rules in `SecurityConfig` plus **ownership checks** in the services, so a student cannot act on someone else's bookings, requests or contacts
- JSON `401` / `403` responses for missing, expired or forbidden access
- Secrets kept out of the repository (environment variables or a git-ignored local file)
- Actuator exposes only the `health` and `info` endpoints

---

## Roles and permissions

| Role | What they can do |
|---|---|
| `ADMIN` | Everything: staff accounts, users and roles, all resource management |
| `FACULTY` | Academic, resources (view), directory, transport booking, own profile |
| `STUDENT` | Academic, library borrowing, directory, transport booking, own profile and emergency contacts |
| `LIBRARIAN` | Library desk: books, requests, returns, overdue; creates and edits libraries (deleting is admin-only) |
| `TRANSPORT_MANAGER` | Vehicles and transport bookings |

---

## Tech stack

**Backend**
- Java 17, Spring Boot 3.2
- Spring Web, Spring Data JPA (Hibernate), Spring Security, Spring Cache, Spring Mail, Actuator
- JWT via jjwt, validation via Hibernate Validator
- springdoc OpenAPI (Swagger UI)
- MySQL 8 (H2 available for tests)
- Maven (wrapper included)

**Frontend**
- React 19, React Router 7, Vite 7
- Tailwind CSS 4, Framer Motion, Lucide icons
- Axios with an interceptor for the JWT and automatic refresh

---

## Project structure

```
Resourcivo/
├── backend/
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   ├── application-local.properties.example   # template for local secrets
│   └── src/
│       ├── main/java/com/project/resourcivo/
│       │   ├── config/          # security, CORS, Swagger, data initializer
│       │   ├── controller/      # REST controllers
│       │   ├── service/         # business logic, email, notifications, scheduler
│       │   ├── repository/      # Spring Data JPA repositories
│       │   ├── model/           # JPA entities and enums
│       │   ├── dto/, mapper/    # request / response objects and mapping
│       │   ├── specification/, criteria/   # search filters
│       │   ├── security/        # JWT provider, filter, user details
│       │   └── exception/       # global error handling
│       ├── main/resources/      # application*.properties
│       └── test/                # tests
└── frontend/
    ├── package.json
    ├── vite.config.js           # dev server on :3000, proxies /api to the backend
    └── src/
        ├── pages/               # Landing, Login, Register, Dashboard, Academic,
        │                        # ResourceCenter, Library, Directory, Transport,
        │                        # Profile, Admin, password and verification pages
        ├── components/          # Navbar, NotificationBell, Transport*, ui/ widgets
        ├── context/             # Auth, Profile and Toast providers
        ├── services/            # Axios API clients, one file per area
        ├── hooks/, utils/       # shared helpers
        └── App.jsx              # routes and role guards
```

---

## Getting started

### Prerequisites
- Java 17
- Node.js 20.19+ or 22.12+ (required by Vite 7) and npm
- MySQL 8
- A Gmail account with an [app password](https://support.google.com/accounts/answer/185833) (or any SMTP server). Email is required because users must verify their address before logging in.

### 1. Clone

```bash
git clone https://github.com/<your-username>/resourcivo.git
cd resourcivo
```

### 2. Create the database

The tables are created automatically on first start (`ddl-auto=update`), but the database itself must exist:

```sql
CREATE DATABASE resourcivo_dev CHARACTER SET utf8mb4;
```

### 3. Configure secrets

```bash
cd backend
cp application-local.properties.example application-local.properties
```

Edit `application-local.properties` and fill in the values (see [Configuration](#configuration)). This file is git-ignored; never commit it.

### 4. Run the backend

```bash
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

The API starts on `http://localhost:2020/resourcivo`. For verbose SQL and security logging, add `--spring.profiles.active=dev`.

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The dev server proxies `/api` to the backend.

### 6. Sign in as admin

On first start the app creates an admin account:

- Username: `username`
- Password: the value of `app.admin.default-password` (the fallback is `password` if you do not set it, so **set it** in `application-local.properties`)

Change the password after your first login. From the Admin page you can create staff accounts and promote users.

---

## Configuration

Secrets are read from environment variables or from `backend/application-local.properties`.

| Setting | Description |
|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | MySQL credentials |
| `JWT_SECRET` | Long random string (32+ characters). The app will not start without it. Generate one with `openssl rand -base64 48`. |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP login (a Gmail app password, not your account password) |
| `app.base-url` | Frontend URL used in verification and reset emails (default `http://localhost:3000`) |
| `app.admin.default-password` | Password for the first-run admin account |
| `app.admin.reset-password-on-startup` | Set to `true` once to recover a lost admin password |

Ports and paths: backend `2020` with context path `/resourcivo`, frontend `3000`.

---

## API overview

Base URL: `http://localhost:2020/resourcivo/api`

Interactive documentation is served by Swagger UI at `http://localhost:2020/resourcivo/swagger-ui.html` while the backend is running.

| Area | Examples |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/verify`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password`, `GET /auth/me` |
| Admin | `POST /admin/staff`, `GET /admin/users`, `PATCH /admin/users/{id}/enabled`, `PUT /admin/users/{id}/roles` |
| Profiles | `/student/me`, `/faculty/me`, `/librarian/me`, `/transport-manager/me`, `/profile-photo/me` |
| Academic | `/student`, `/faculty`, `/course`, `/subject`, `GET /public/subjects` |
| Library | `/library`, `/library-book`, `/student/issue-request`, `/librarian/return-requests`, `/librarian/overdue` |
| Resources | `/inventory-item`, `/lab-equipment`, `/classroom` |
| Transport | `/transport`, `/transport/bookings/me`, `/transport-manager` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `POST /notifications/read-all` |
| Dashboard | `GET /dashboard/summary` |

Search endpoints accept filters plus optional `page`, `size`, `sortBy` and `direction` parameters.

---

## Testing

```bash
cd backend
./mvnw test
```

The tests in `src/test` are Spring Boot tests, so they need the same database and secrets configured as a normal local run. Frontend linting:

```bash
cd frontend
npm run lint
```

---

## Known limitations

- Plain "get all" endpoints are not paged (the search endpoints are).
- Contact, address and emergency-contact search filters are not implemented yet.
- Temporary passwords for staff accounts are sent by email in plain text; if that is a concern, switch mail off and hand them over directly.
- Production deployment configuration (the `prod` profile, Docker, reverse proxy) is still being prepared.
