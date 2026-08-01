# TODO / Deferred work

Known items intentionally left for later. Newest first.

## Global search (top-bar) — not implemented
_Added 2026-07-29_

The top-bar search box ("Search leads, students, apps…") is a **decorative placeholder** — kept in the UI for now, to be wired later.

- **Where:** `src/app/layout/Topbar.tsx` (~L181–205). The `TextField` has no `value`, `onChange`, `onKeyDown`/submit handler, state, or navigation.
- **Verified:** typing + Enter produces no navigation and no network call; text just sits in the box.
- **Backend:** `GET /api/leads/search` exists but is a **stub returning `[]`** (see `LeadController.searchLeads` in the `trakv` repo).
- **Not the same as** the leads-page toolbar search (`GlobalSearchBar`), which works client-side over loaded rows.

**Options when we pick this up:**
1. Wire minimally — on Enter, `navigate("/leads?q=…")` and reuse the leads page's client-side filter. Quick, but only searches leads, so the "students, apps" placeholder overpromises (narrow the placeholder to "Search leads…").
2. Full global search — implement backend `/search` across leads + students + applications, then wire the box to it. Delivers what the placeholder advertises.

## Lead table — Score column always shows "—"
_Added 2026-07-29_

Backend sets `score = 0.0` on create and nothing computes it, so every row renders "—" (`LeadTableContainer.tsx`). Either hide the column until a scoring mechanism exists, or leave as a placeholder.

## Dashboard — right-column whitespace on wide screens
_Added 2026-07-29_

After the viewport-fit change, on `lg+` the left column fills while the right column holds only the Performance card, leaving a gap (`DashboardLeadsSection.tsx`). Cosmetic — could balance the two columns' heights or move another section into the right column.
