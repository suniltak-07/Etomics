@AGENTS.md

# EatOmics

Meal subscription app (customer + admin portals). Auth is proxied to the OFOOD backend.

## Tests

Do **not** write, update, or run tests for this project right now. We will add tests later. Prefer implementing features and wiring APIs over expanding the test suite.

## Auth roles

- After login/signup, users go to the portal for their role:
  - `CUSTOMER` / `ROLE_CUSTOMER` → `/customer/dashboard`
  - `ADMIN` / `ROLE_ADMIN` → `/admin/dashboard`
- Admin and customer layouts wrap pages in `ProtectedRoute`. On refresh it calls `/me` (which refreshes an expired access token) and stays on the same page. Do not bounce through `/splash` for portal reloads.
