# Student Reminder Website

React + TypeScript + Tailwind frontend and Node/Express + Prisma backend.
Students browse read-only; only the teacher logs in to add or edit content.

> Build status: **Phase 3 (frontend pages) complete.** Animations, offline/installable app support
> and the full deployment README come in phase 4.

## Structure

```
frontend/   React 18 + Vite + Tailwind (components, pages, hooks, api, store, types, utils)
backend/    Express + Prisma (routes, controllers, middleware, services, prisma)
start.bat   Windows: installs, configures, seeds and starts everything
```

## Easiest way to run (Windows)

Double-click `start.bat`. It asks once for the teacher password, then opens the site.

## Manual setup

```bash
npm run install:all

# backend
cd backend
cp .env.example .env                       # then fill in the values
npm run hash-password -- "your-password"   # paste the output into .env
npx prisma db push
npm run db:seed
npm run dev                                # http://localhost:4000/api/health

# frontend (new terminal)
cd frontend
cp .env.example .env
npm run dev                                # http://localhost:5173
```

## Themes

Themes are CSS variables (`frontend/src/index.css`) switched by `<html data-theme>` and stored per
visitor in `localStorage`. All presets were checked against WCAG AA (4.5:1) for text, muted text,
primary and accent colors.

## API (phase 2)

GET routes are public. POST, PUT, PATCH, DELETE and uploads need the admin login cookie **and** the
header `X-Requested-With: sr-web` (the frontend client adds it; it blocks cross-site request forgery).

| Route | Notes |
| --- | --- |
| `POST /api/auth/login` | `{username, password}`; sets httpOnly cookies; 10 failed tries per 15 min per IP |
| `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/me` | `me` returns `{admin: boolean}` and never a 401 |
| `/api/subjects`, `/api/tasks`, `/api/performance-tasks`, `/api/reviewers`, `/api/events`, `/api/announcements` | `GET /`, `GET /:id`, `POST /`, `PUT /:id` (full), `PATCH /:id` (partial), `DELETE /:id` |
| `GET /api/tasks?subjectId=...` | same filter on performance tasks and reviewers; `GET /api/events?scope=upcoming` or `past` |
| `POST /api/attachments/links` | `{ownerType, ownerId, name, url}` (http/https only) |
| `POST /api/upload` | multipart: `file`, `ownerType`, `ownerId`, optional `name` |
| `DELETE /api/attachments/:id` | also deletes the stored file |

`ownerType` is `TASK`, `PERFORMANCE_TASK` or `REVIEWER`. Tasks, performance tasks and reviewers come
back with an `attachments` array.

Security notes: text is stripped of HTML on the way in (render it as text, never as HTML); uploads
allow only PDF, Word, PowerPoint, Excel, TXT and common images, checked by file signature, not just
extension. Sessions are stateless JWTs: to sign out every device at once, change `JWT_REFRESH_SECRET`.

## Pages (phase 3)

| Page | What it does |
| --- | --- |
| `/` Dashboard | Date, pinned announcements, stats, due soon, overdue in red, upcoming events |
| `/tasks` | Filter by subject, priority and status; sort; search; students tick Done (saved only on their device) |
| `/performance-tasks` | Status badges (Upcoming, Due Soon, Overdue), rubric, attachments |
| `/reviewers` | Subject tabs, files and links, download buttons |
| `/calendar` | Month, week and agenda views; color by type or subject; day and item details; export to .ics |
| `/events` | Upcoming events and an Archive tab |
| `/announcements` | Teacher posts; pinned first |
| `/admin` | Teacher login, then add/edit/pin/delete for everything, plus subjects |

Search anywhere with Ctrl+K (or Cmd+K). Students never see Add, Edit, Delete or Upload; those
appear only after the teacher logs in at `/admin`. The Admin link is not shown to students.

## Teacher quick-add

After logging in at `/admin`, a red **＋ Add** button appears in the top bar and as a floating button
in the corner of every page. It opens a menu (Task, Performance task, Reviewer, Event, Announcement,
Subject); the kind that belongs to the page you are on is listed first. Students never see it.
