# InfiniteCareers - Enterprise Frontend

The Next.js 14 frontend for the **InfiniteCareers** Applicant Tracking, Recruitment, Hiring, Preboarding, and Employee Onboarding SaaS Platform.

## Architecture

The frontend is divided into two distinct surfaces:
1. **Enterprise Platform (`/`)**: High-density SaaS workspace for Recruiters, Hiring Managers, HR Ops, and Admins.
   - Requisitions, Kanban Talent Pipeline, Candidate Management, Interview Scheduling & Scorecards, Offers & Compensation Matrix, Workflow State Machine & Approvals, Employee Directory & Dynamic Org Charts, Analytics & AI Hub.
2. **Public Candidate Portal (`/careers`, `/portal/candidate`)**: Clean external applicant surface.
   - Brand job board, Multi-step application wizard, Live status tracker, Meeting link integrations, Typed & Canvas digital offer signing, Preboarding compliance task completion.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI Engine**: React 18, TypeScript Strict Mode
- **Styling**: Tailwind CSS with custom enterprise design system
- **State Management**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form, Zod
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Initialize Prisma SQLite / DB client
npx prisma generate
npx prisma db push
node prisma/seed.js

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

Runs on `http://localhost:3000`.
