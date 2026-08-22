@AGENTS.md

# EatOmics

Meal subscription app (customer + admin portals). Auth is proxied to the OFOOD backend.

## Tests

Do **not** write, update, or run tests for this project right now. We will add tests later. Prefer implementing features and wiring APIs over expanding the test suite.

## Auth roles

- After login/signup and on portal refresh, users go through `/splash`, which calls `/me` once, then routes:
  - `CUSTOMER` / `ROLE_CUSTOMER` → `/customer/dashboard`
  - `ADMIN` / `ROLE_ADMIN` → `/admin/dashboard`
- Do not call `/me` from portal layouts or global providers.
