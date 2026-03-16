# 📸 Face Attendance System

An AI-powered facial recognition attendance management system built with React, TypeScript, and Lovable Cloud (Supabase).

## ✨ Features

- **🔐 Authentication** — Email/password signup & login with protected routes
- **📷 Face Recognition Attendance** — Upload class photos to automatically detect and mark attendance using AI
- **👨‍🎓 Student Management** — Add, edit, and delete students with photos, roll numbers, and class assignments
- **🏫 Class Management** — Create and manage classes with department, section, and semester info
- **📚 Subject Management** — Manage subjects with codes and link them to classes
- **📅 Schedule Management** — Assign subjects to classes with day/time scheduling
- **📊 Attendance Reports** — View and analyze attendance data with filtering and export options
- **👩‍🏫 Role-Based Access Control** — Admin and teacher roles with class-scoped data access via RLS policies
- **🌙 Dark/Light Theme** — Beautiful UI with theme support

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Lucide Icons |
| **State Management** | TanStack React Query |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form, Zod validation |
| **Backend** | Lovable Cloud (Supabase) |
| **Database** | PostgreSQL with Row-Level Security |
| **Auth** | Supabase Auth (email/password) |
| **Storage** | Supabase Storage (student & session photos) |
| **Edge Functions** | Deno-based serverless functions (face recognition) |
| **AI** | Lovable AI (Gemini) for facial recognition |
| **Charts** | Recharts |

## 📁 Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── AttendanceScanner.tsx
│   │   ├── ClassManager.tsx
│   │   ├── FaceScanner.tsx
│   │   ├── Navigation.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── StudentManager.tsx
│   │   └── ...
│   ├── contexts/            # React contexts (AuthContext)
│   ├── hooks/               # Custom hooks
│   ├── integrations/        # Supabase client & types (auto-generated)
│   ├── pages/               # Route pages
│   │   ├── TakeAttendance.tsx
│   │   ├── Students.tsx
│   │   ├── Classes.tsx
│   │   ├── Subjects.tsx
│   │   ├── Schedule.tsx
│   │   ├── Reports.tsx
│   │   └── Login.tsx
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── functions/
│   │   └── recognize-faces/ # Edge function for AI face recognition
│   └── config.toml
└── package.json
```

## 🚀 Getting Started (VS Code / Local)

### Prerequisites

- **Node.js** v18+ — [Install via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js)
- **Git**

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root (this is auto-generated if using Lovable):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

> **Note:** If you cloned from Lovable's GitHub integration, the `.env` file is already configured.

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:8080**.

### 5. Build for Production

```bash
npm run build
npm run preview
```

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `classes` | Class info (name, department, section, semester) |
| `students` | Student records with photos and class assignments |
| `subjects` | Subject names and codes |
| `class_subjects` | Schedule linking subjects to classes with day/time |
| `attendance_sessions` | Attendance session records per class |
| `attendance_records` | Individual student attendance per session |
| `user_roles` | Role-based access (admin, teacher) |
| `teacher_classes` | Maps teachers to their assigned classes |

### Security

- **Row-Level Security (RLS)** is enabled on all tables
- Teachers can only access data for their assigned classes
- Admins have full access
- `has_role()` and `user_has_class_access()` helper functions prevent RLS recursion

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🔧 Troubleshooting

| Issue | Solution |
|-------|---------|
| **Blank page after login** | Ensure `.env` variables are correctly set |
| **Cannot access data** | Admin must assign your account to classes via `teacher_classes` |
| **Face recognition fails** | Ensure students have uploaded photos and the edge function is deployed |
| **Port 8080 in use** | Kill the process or change the port in `vite.config.ts` |

## 📄 License

This project is private and proprietary.
