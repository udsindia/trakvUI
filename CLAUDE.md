# Trakv UI — Frontend

Multi-tenant education/visa CRM UI. React 19 + MUI v7 + TypeScript + Vite + Redux Toolkit + TanStack Query. Dev server on **:3000**. Talks to the backend at **:8080** (repo `../trakv`).

## Build & checks
- Type-check (the real gate — project references): `npx tsc -b`.
- Run: `npm run dev`.

## Structure
- Feature modules under `src/modules/*` (dashboard, lead, applications, universities, activities, settings, sa-team). Each has `pages/`, `components/`, an `*Api.ts` + `*Service.ts`, and route files.
- Shared HTTP client: `src/shared/services/http/client.ts` (adds the auth token; base URL from `VITE_API_BASE_URL`).
- Auth/permissions: `src/config/permissions/permissions.ts` (the `PERMISSIONS` map), `src/config/roles/roles.ts`. Nav gating: `src/config/modules/module-catalog.ts` + `src/app/module-loader/module-registry.ts`. Use `useAuth().hasPermissions([...])` to gate UI.

## Permission taxonomy (must match the backend)
- Consolidated **singular** names: `USER_VIEW`, `ROLE_VIEW`, `APPLICATION_VIEW`, `UNIVERSITY_VIEW`, `TASK_VIEW`, `COMMISSION_VIEW`, etc. Record visibility is the role's scope, not a permission.
- ⚠️ **Branch compatibility:** the frontend's permission/role names must match the running backend's. An older taxonomy (plural `USERS_VIEW`/`UNIVERSITIES_VIEW`/… and roles `APPLICATION_MANAGER`/`ANALYST`, e.g. on `feature/ghouse/tenant`) run against a consolidated backend **hides nav tabs** because names don't match. If tabs are missing, check this first.

## Conventions
- Prefer React Query for server state; the query key for a list is invalidated after mutations (e.g. `["applications"]`, `["leads"]`).
- Gate sensitive UI by permission (e.g. commission fields only render with `COMMISSION_VIEW`; edit only with `COMMISSION_MANAGE`).
- After changes, run `npx tsc -b`; Vite HMR picks up most edits (restart the dev server after adding a dependency).
