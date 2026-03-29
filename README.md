# EduTrack Visa Counselling Platform

Frontend workspace for a modular visa counselling CRM built with React 19, Vite, TypeScript, Material UI, Redux Toolkit, React Router, TanStack Query, Axios, React Hook Form, and TanStack Table.

The current implementation includes:

- App shell with authenticated routing and module-based navigation
- Mock auth with role and permission simulation
- Tenant-aware module enablement
- Lead Management dashboard and add-lead flow
- Shared UI primitives for CRM pages and forms

## Tech Stack

- React 19
- TypeScript 5
- Vite 8
- Material UI 7
- React Router 7
- Redux Toolkit
- TanStack Query
- Axios
- React Hook Form
- TanStack Table

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Environment Notes

The app supports mock auth and API auth modes.

- `VITE_AUTH_MODE=mock` is the default behavior when the variable is not set
- `VITE_AUTH_MODE=api` switches login to the configured backend
- `VITE_API_BASE_URL` controls the Axios base URL and defaults to `/api`

Auth session data is persisted in `localStorage` under `edutrack.auth.session`.

## Current Route Map

- `/login`
- `/dashboard`
- `/leads`
- `/leads/create`
- `/applications`
- `/activities`
- `/unauthorized`

## Architecture Overview

### 1. App Bootstrapping

Runtime flow:

1. `src/main.tsx` mounts the application in `StrictMode`
2. `src/app/App.tsx` renders the app shell
3. `src/app/store/AppProviders.tsx` composes:
   - Redux store
   - TanStack Query client
   - Material UI theme
   - Auth bootstrap provider
4. `src/app/AppShell/AppShell.tsx` resolves auth-aware shell state and mounts the router

### 2. Routing Model

The app uses a shell-first route model:

- `src/app/router/AppRouter.tsx` owns top-level routes
- `src/app/router/guards.tsx` protects authentication and module access
- `src/app/layout/MainLayout.tsx` provides the shared navbar and page outlet
- Each module is lazy-loaded from `src/app/module-loader/module-registry.ts`

Module routes are mounted as `/${module.path}/*`, which allows each module to own its nested routes without polluting the global router.

### 3. Module System

Module metadata is defined in:

- `src/config/modules/module-catalog.ts`
- `src/config/modules/modules.ts`
- `src/config/modules/module.types.ts`

Each module definition controls:

- path
- label and icon metadata
- sort order
- allowed roles
- required permissions

Module enablement is tenant-aware. Even if a route exists, it will not mount unless the tenant has the module enabled and the user satisfies RBAC requirements.

### 4. Authentication and RBAC

Auth implementation lives in:

- `src/app/auth/authService.ts`
- `src/app/auth/authSlice.ts`
- `src/app/auth/authHooks.ts`
- `src/app/auth/AuthProvider.tsx`

Current behavior:

- Mock auth creates tenant, user, roles, permissions, and token metadata locally
- API auth uses `httpClient.post("/auth/login")`
- Access tokens are injected through an Axios interceptor
- Unauthorized responses trigger logout

RBAC definitions live in:

- `src/config/roles/roles.ts`
- `src/config/permissions/permissions.ts`

Notable lead permissions:

- `lead:view`
- `lead:manage`
- `lead.create`

### 5. State Management

State is intentionally split by responsibility:

- Redux Toolkit:
  - auth session
  - shell UI state such as mobile navigation
- React Hook Form:
  - local form state for add-lead flow
- TanStack Query:
  - query/mutation client is configured and ready
  - data fetching patterns are prepared for future integration

## Project Structure

```text
src/
  app/
    App.tsx
    AppShell/
    auth/
    layout/
    module-loader/
    router/
    store/
  config/
    modules/
    permissions/
    roles/
  modules/
    dashboard/
    lead/
    applications/
    activities/
  shared/
    components/
    hooks/
    services/
    ui/
```

## Current Modules and Pages

### Dashboard Module

Status: scaffolded

- Route: `/dashboard`
- File: `src/modules/dashboard/DashboardModule.tsx`
- Purpose: placeholder for KPI widgets and cross-functional summaries

### Lead Management Module

Status: actively implemented

- Base route: `/leads`
- Module entry: `src/modules/lead/LeadModule.tsx`
- Route config: `src/modules/lead/leadRoutes.ts`
- Path constants: `src/modules/lead/leadRoutePaths.ts`

#### Lead Dashboard Page

Route: `/leads`

Files:

- `src/modules/lead/pages/LeadDashboardPage.tsx`
- `src/modules/lead/components/PageHeader.tsx`
- `src/modules/lead/components/LeadQuickFilters.tsx`
- `src/modules/lead/components/LeadTableContainer.tsx`

Current UI includes:

- CRM-style page header
- Shared search bar in the header, not the navbar
- Left fixed filter panel
- Quick filter tabs
- Bulk action bar
- Lead table
- Row action menu
- Pagination shell
- Add Lead CTA in the header

#### Add Lead Page

Route: `/leads/create`

Files:

- `src/modules/lead/pages/AddLeadPage.tsx`
- `src/modules/lead/components/AlertBanner.tsx`
- `src/modules/lead/components/LeadForm.tsx`
- `src/modules/lead/useLeadFormController.ts`
- `src/modules/lead/leadForm.types.ts`
- `src/modules/lead/leadForm.options.ts`

Current behavior includes:

- RBAC-protected route requiring `lead.create`
- Centered form card
- Warning placeholder banner
- Local RHF form state
- Validation on blur and submit
- Mock payload generation and console submission
- Cancel resets form and returns to dashboard

Form payload currently maps to:

```ts
{
  name,
  phone,
  email,
  countries: [],
  courses: [],
  source,
  agent,
  intakeDate,
  tags: [],
  notes,
}
```

### Applications Module

Status: scaffolded

- Route: `/applications`
- File: `src/modules/applications/ApplicationsModule.tsx`

### Activities Module

Status: scaffolded

- Route: `/activities`
- File: `src/modules/activities/ActivitiesModule.tsx`

## Shared Components

### Layout and Feedback

- `ModuleScaffold`
  - placeholder module shell for unfinished modules
- `FeedbackState`
  - reusable state screen for unauthorized and not-found views
- `LoadingScreen`
  - suspense/loading surface

### CRM Workspace Components

- `GlobalSearchBar`
  - reusable debounced search input
  - controlled and uncontrolled support
- `FilterPanel`
  - reusable left-side filter rail
  - sticky header and footer
  - scrollable middle content
  - config-driven control rendering
- `BulkActionsBar`
  - reusable table bulk-action toolbar
- `MultiSelectAutocomplete`
  - reusable multi-select input
  - chip rendering
  - optional custom/free-solo entry support

## Shared Services

### HTTP

`src/shared/services/http/client.ts`

- central Axios instance
- auth header interceptor
- unauthorized response handling hook

### Query

`src/shared/services/query/queryClient.ts`

- centralized TanStack Query client
- default stale time and retry policy

### Theme

`src/shared/ui/theme.ts`

- shared MUI theme
- primary and secondary brand colors
- global paper and typography defaults

## Lead Module Design Notes

The lead module currently follows a container-plus-presentational split for the add-lead flow:

- `AddLeadPage`
  - page shell
  - composes alert banner and form
- `useLeadFormController`
  - form setup
  - submit preparation
  - cancel/reset behavior
- `LeadForm`
  - presentational UI only
  - receives typed form instance, options, and handlers

This separation should be preserved as API integration is added.

## Development Guidelines

### 1. Preserve Module Boundaries

When adding new functionality:

- keep module-specific pages inside `src/modules/<module>/pages`
- keep module-specific UI inside `src/modules/<module>/components`
- keep module-specific route definitions inside the module, not the global router
- do not move feature logic into `shared` unless at least two modules need it

### 2. Use Shared Components Before Creating New Variants

Before adding a new CRM-style control, check whether it should extend:

- `GlobalSearchBar`
- `FilterPanel`
- `BulkActionsBar`
- `MultiSelectAutocomplete`
- `PageHeader` if the usage remains lead-specific, otherwise consider promoting a generalized version

If the behavior is broadly reusable, create or extend a shared component instead of cloning module markup.

### 3. Keep Form Logic Out of Presentational Components

For new forms:

- keep `useForm` setup in a controller hook or page-level container
- pass typed `UseFormReturn` and handlers into presentational form components
- keep payload mapping separate from field layout
- use local RHF state unless there is a proven cross-page workflow requiring persistence

### 4. Respect RBAC at Route Level

Route protection should not rely only on hiding buttons.

For any new secured page:

- define the permission in `src/config/permissions/permissions.ts`
- add role mappings deliberately
- register the route in the module route config
- guard the route itself, not just the navigation control

### 5. Keep Navbar Generic

The navbar is for:

- tenant identity
- module navigation
- notifications
- user menu

Do not place page-local search, filters, or workflow buttons inside the navbar. Those belong to the module page header.

### 6. Avoid Hardcoding Business Data Inside UI Components

Current mock option sets already live outside the form component. Continue that pattern:

- keep options in module config files or data adapters
- keep route paths in route constants
- keep payload types in dedicated type files

### 7. Prefer Route Constants Over String Literals

For any navigation within a module:

- expose path constants from the module
- consume those constants in buttons, redirects, and cancel handlers

### 8. Expand Lead Management Carefully

Recommended next steps for the lead module:

1. connect dashboard search/filter state to actual table filtering
2. replace mock lead rows with query-backed data
3. submit add-lead payload through a TanStack Query mutation
4. add success/error feedback states and optimistic UX where appropriate
5. introduce details and edit pages under the same route-config pattern

## Known Limitations

- Dashboard, Applications, and Activities are still scaffold modules
- Lead Dashboard uses mock data and UI-only bulk/row actions
- Add Lead submission is mocked and only logs a payload
- No automated test suite is configured yet
- Mock auth session values persist until logout or local storage is cleared

## Recommended Contribution Pattern

When adding new work:

1. define or extend the module route and permission first
2. add page shell and presentational components
3. isolate controller logic, payload mapping, and options
4. reuse shared UI primitives where possible
5. run `npm run typecheck`
6. update this README if architecture or module behavior changes
