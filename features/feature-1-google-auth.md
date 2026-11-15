# Feature: Google Authentication

**Feature ID:** 1
**Branch pattern:** `features/1-google-auth`
**Status:** Draft
**Created:** 2026-10-29
**Input:** Users sign in with Google. The first successful sign-in creates their account. There is no password.

---

## User Stories

### US-1.1: Sign in with Google (new account)
**As a** new user
**I want to** sign in with my Google account
**So that** the app creates my user record from my Google name and email.

**Priority:** P1
**Independent test:** a new Google `sub` returns `201`, `role` is `user`, `user` is in `localStorage`, and the app lands on `home`
**Acceptance scenarios:** see ### US-1.1 under Acceptance Criteria

### US-1.2: Sign in with Google (existing account)
**As a** registered user or admin
**I want to** sign in with the same Google account
**So that** I can access the screens my role allows with a session

**Priority:** P1
**Independent test:** known `sub` returns `200` and a token, then redirect to `home`.
**Acceptance scenarios:** see ### US-1.2 under Acceptance Criteria

### US-1.3: Stay signed in across page loads
**As a** signed-in user
**I want** my session to persist in the browser
**So that** refreshing the page does not force me to sign in again

**Priority:** P1
**Independent test:** Refresh a protected route with a valid `localStorage` session — no re-login
**Acceptance scenarios:** see ### US-1.3 under Acceptance Criteria

### US-1.4: Sign out
**As a** signed-in user
**I want to** sign out
**So that** no one else can use my account on a shared device

**Priority:** P2
**Independent test:** Sign out clears the server session and `localStorage`; user lands on login
**Acceptance scenarios:** see ### US-1.4 under Acceptance Criteria

### US-1.5: Block unauthenticated access
**As the** application
**I want to** require a valid session for every non-auth screen and API route
**So that** protected data is never served to anonymous callers

**Priority:** P1
**Independent test:** Navigate to a protected route without a session → redirect to login; API without token → `401`
**Acceptance scenarios:** see ### US-1.5 under Acceptance Criteria

### US-1.6: Distinguish admins from users
**As the** application
**I want to** carry a role on every session and expose a reusable admin guard
**So that** Features that edit data can only be accessed by admin

**Priority:** P1
**Independent test:** Call a route wrapped in `requireAdmin` as a user → `403`; as an admin → `200`
**Acceptance scenarios:** see ### US-1.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Users MUST authenticate only with a Google ID token. The app MUST NOT collect, hash, or store a password.
- **FR-002**: The login page MUST use Google Identity Services to obtain an ID token and POST it to the backend. The backend MUST verify signature, audience (`GOOGLE_CLIENT_ID`), issuer (https://accounts.google.com), and `email_verified === true` before creating a session.
- **FR-003**: The first verified token for a new Google `sub` MUST create the user. `googleId` is `sub`. `email`, `fName`, and `lName` come from the token (`email`, `given_name`, `family_name`), not from a form.
- **FR-004**: Sessions MUST use a **JWT + Session table** pattern: the token is stored server-side and the client sends `Authorization: Bearer <token>`.
- **FR-005**: Session lifetime MUST be **24 hours** from creation.
- **FR-006**: Login MUST reuse a non-expired session for the same user when one already exists.
- **FR-007**: That new user MUST get role `user`. The endpoint MUST ignore any `role` in the body.
- **FR-008**: Admin accounts MUST be created only by a seed script that sets `role` to `admin` for a known Google email or `googleId`. There is no public promote endpoint. The admin signs in with that Google account.
- **FR-009**: Every authenticated request MUST resolve to exactly one user via `req.user.id` from the session token, and MUST expose `req.user.role`.
- **FR-010**: The backend MUST export a reusable `requireAdmin` middleware from `backend/app/authorization/authorization.js` that rejects non-admin callers with `403`.
- **FR-011**: The success payload MUST still include `role`.
- **FR-012**: Store `email` from the verified token.
- **FR-013**: Reject the token when `email_verified` is not true, with `401` and no user row created.

---

## Assumptions

- Google is the only identity provider. GOOGLE_CLIENT_ID is configured on the frontend and backend.
- Every user has a Google account. The client ID is public. Only the backend’s verification of the ID token establishes identity.
- A single browser `localStorage` session per device; no multi-tab sync beyond shared storage.

## Edge Cases

- User closes or cancels the Google prompt → stay on login, no API call.
- Missing, expired, wrong-audience, or otherwise invalid ID token → `401` with `{ "message": "Google sign-in failed." }`, no session.
- Missing or expired token on a protected API → `401`; the frontend clears the session and redirects to login.
- `email_verified` is false → `401`, no user row.
- Same `sub` already exists → sign in (`200`), do not return duplicate-email `400`.
- Body contains `"role": "admin"` on first sign-in → stored role is still `user`.
- A user calling an admin-guarded route → `403` (role guard), which is distinct from the `404` used for another user's row.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A new Google user can sign in, land on home, refresh without signing in again, and sign out.
- **SC-003**: The seeded admin Google account receives `role: "admin"`.
- **SC-004**: `npm test` passes with backend Google auth coverage and frontend router and login coverage.

---

## Data Ownership & Isolation (foundation)

Feature 1 establishes identity and role; Other features enforce the data boundaries built on it.

| Rule | Requirement |
|------|-------------|
| **Identity** | Every authenticated request resolves to one user through the Session row; `req.user = { id, role }` |
| **Role source** | Role comes from the joined `users` row, never from the request body or a client header |
| **Self-service writes** | The first Google sign-in creates only `user` accounts |
| **Cross-user rows** | No endpoint in this feature returns another user's profile or session |
| **Role guard vs ownership** | Admin-only *collections* → `403` via `requireAdmin`. Another user's *row* → `404` (do not confirm existence). Later features follow this split. |
| **Implementation** | `authenticate` and `requireAdmin` live in `backend/app/authorization/authorization.js` — controllers must not re-implement either check |

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/vehicles/auth/google` | No | Verify the Google ID token, create or reuse the user, return the session payload |
| `POST` | `/vehicles/logout` | Yes | Invalidate the current session token |

**Google Auth POST body:**
```json
{ "idToken": "<google-id-token>" }
```

**Google Auth success response** (flat JSON, no envelope):
```json
{
  "userId": 1,
  "email": "jane@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "user",
  "token": "<jwt>"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with the appropriate HTTP status.

| Status | Used for |
|--------|----------|
| `201` | First sign-in created the user and a session |
| `200` | Existing user signed in, or logout |
| `401` | Bad Google token, unverified email, missing app token, expired app token |
| `403` | Authenticated but role is not `admin` on a `requireAdmin` route |

---

## Screen Requirements

### [View: Login Page] — route name `login`
*   Full-screen auth layout (no `MenuBar`).
*   Primary action: **Sign in with Google** — `<v-btn color="primary" variant="elevated" class="oc-cta" :loading="loading">`.
*   Failed verification renders `<v-alert type="error" density="compact">` with the server message.

### [View: Home placeholder] — route name `home`
*   Minimal protected landing page shown after a successful sign-in.
*   Displays a welcome message using the user's first name.
*   Displays the signed-in role as a `<v-chip>` so the admin/user distinction is demonstrable before later features add real screens.
*   **Sign out** button on this page (standalone `v-btn`; moves into `MenuBar` when a later feature introduces app chrome).
*   **No `MenuBar`** anywhere in Feature 1 — auth pages and this placeholder use a full-screen layout only.

**Router guard:** `router.beforeEach` redirects to `login` when no `user` is in storage and the target route is not `login`; it redirects an already-signed-in user away from `login` to `home`.

---

## Key Entities

- **User**: a Google-backed account with `googleId`, email, name, and role `user` or `admin`.
- **Session**: a server-side record tying a JWT token to a user; expires 24 hours after creation.

---

## Data Model Requirements

### `users` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `googleId` | STRING | Required, unique; Google `sub` |
| `fName` | STRING | From `given_name`; may be empty |
| `lName` | STRING | From `family_name`; may be empty |
| `email` | STRING | Required, unique |
| `role` | STRING(20) | Required; `user` or `admin`; defaults to `user` |

### `sessions` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required |
| `userId` | INTEGER FK | Required, references `users.id` |

### Associations
*   `User hasMany Session`
*   `Session belongsTo User`

Associations are wired in `backend/app/models/index.js`, not in controllers.

---

## Acceptance Criteria (Gherkin)

### US-1.1 — Sign in with Google (new account)

#### Scenario: New Google user signs in
*   **Given** I am on the login page
*   **And** no user exists for Google subject `google-sub-jane`
*   **When** I sign in with a verified Google ID token for `jane@example.com` with subject `google-sub-jane`, given name `Jane`, and family name `Doe`
*   **Then** the API returns `201` with a payload including `userId`, `email`, `fName`, `lName`, `token`, and `role`
*   **And** the returned `email` is `jane@example.com`
*   **And** the returned `role` is `user`
*   **And** my user record is stored with a `googleId` `google-sub-jane` and no password
*   **And** I am redirected to the home page
*   **And** my session is stored in `localStorage` under the key `user`

#### Scenario: First sign-in ignores a role supplied in the request body
*   **Given** no user exists for Google subject `google-sub-sneaky`
*   **When** I POST `/vehicles/auth/google` with a verified ID token for that subject and `"role": "admin"`
*   **Then** the API returns `201`
*   **And** the returned `role` is `user`
*   **And** the stored user record has role `user`

#### Scenario: Unverified Google email is rejected
*   **Given** no user exists for Google subject `google-sub-unverified`
*   **When** I POST `/vehicles/auth/google` with an ID token whose `email_verified` claim is false
*   **Then** the API returns `401` with `{ "message": "Google sign-in failed." }`
*   **And** no user record is stored

#### Scenario: User cancels the Google prompt
*   **Given** I am on the login page
*   **When** I dismiss the Google sign-in prompt
*   **Then** I remain on the login page
*   **And** no API request is sent

---

### US-1.2 — Sign in with Google (existing account)

#### Scenario: Returning user signs in with Google
*   **Given** I am on the login page
*   **And** a user exists with `googleId` `google-sub-jane` and email `jane@example.com`
*   **When** I sign in with a verified Google ID token for that same subject
*   **Then** the API returns `200` with a payload containing `userId`, `email`, `token`, and `role`
*   **And** a session row is created or reused in the database
*   **And** I am redirected to the home page
*   **And** my session is stored in `localStorage` under the key `user`

#### Scenario: Invalid Google ID token is rejected
*   **Given** I am on the login page
*   **When** I POST `/vehicles/auth/google` with an invalid ID token
*   **Then** the API returns `401` with `{ "message": "Google sign-in failed." }`
*   **And** I remain on the login page
*   **And** the error is displayed in a `<v-alert type="error">`

---

### US-1.3 — Stay signed in across page loads

#### Scenario: Signed-in user visits login page
*   **Given** I have a valid session in `localStorage`
*   **When** I navigate to the login page
*   **Then** I am redirected to the home page

#### Scenario: API request includes session token
*   **Given** I am signed in
*   **When** the frontend makes an authenticated API request
*   **Then** the request includes header `Authorization: Bearer <token>`

#### Scenario: Expired or invalid session token
*   **Given** I am signed in with an expired or revoked token
*   **When** the frontend makes an authenticated API request
*   **Then** the API returns `401` with an unauthorized message
*   **And** `localStorage` key `user` is cleared
*   **And** I am redirected to the login page

---

### US-1.4 — Sign out

#### Scenario: User signs out
*   **Given** I am signed in on the home page
*   **When** I click **Sign out**
*   **Then** the API invalidates my session token on the server
*   **And** `localStorage` key `user` is removed
*   **And** I am redirected to the login page

#### Scenario: Reusing a token after sign out fails
*   **Given** I have signed out
*   **When** I replay my previous Bearer token against a protected route
*   **Then** the API returns `401`

---

### US-1.5 — Block unauthenticated access

#### Scenario: Unauthenticated user accesses a protected route
*   **Given** I have no session in `localStorage`
*   **When** I navigate directly to the home page
*   **Then** I am redirected to the login page

#### Scenario: Protected API request without a token
*   **Given** I have no session token
*   **When** I send a request to a route wrapped in `authenticate`
*   **Then** the API returns `401` with `{ "message": "Unauthorized! No token provided." }`

---

### US-1.6 — Distinguish admins from users

#### Scenario: Seeded admin signs in with Google and receives the admin role
*   **Given** an admin account has been created by the seed script for Google subject `google-sub-admin`
*   **When** the admin signs in with a valid Google ID token for that subject
*   **Then** the API returns `200`
*   **And** the returned `role` is `admin`

#### Scenario: User is rejected by the admin guard
*   **Given** I am signed in as a user
*   **When** I send a request to a route wrapped in `requireAdmin`
*   **Then** the API returns `403` with `{ "message": "Forbidden! Admin access required." }`

#### Scenario: Admin passes the admin guard
*   **Given** I am signed in as an admin
*   **When** I send a request to a route wrapped in `requireAdmin`
*   **Then** the request is allowed through to the controller

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-1.1 | New Google user signs in | `backend/tests/auth.test.js` | `New Google user signs in` |
| US-1.1 | First sign-in ignores a role supplied in the request body | `backend/tests/auth.test.js` | `First sign-in ignores a role supplied in the request body` |
| US-1.1 | Unverified Google email is rejected | `backend/tests/auth.test.js` | `Unverified Google email is rejected` |
| US-1.1 | User cancels the Google prompt | `frontend/tests/Login.test.js` | `User cancels the Google prompt` |
| US-1.2 | Returning user signs in with Google | `backend/tests/auth.test.js` | `Returning user signs in with Google` |
| US-1.2 | Invalid Google ID token is rejected | `backend/tests/auth.test.js`, `frontend/tests/Login.test.js` | `Invalid Google ID token is rejected` |
| US-1.3 | Signed-in user visits login page | `frontend/tests/router.test.js` | `Signed-in user visits login page` |
| US-1.3 | API request includes session token | `backend/tests/authenticate.test.js` | `API request includes session token` |
| US-1.3 | Expired or invalid session token | `backend/tests/authenticate.test.js` | `Expired or invalid session token` |
| US-1.4 | User signs out | `backend/tests/auth.test.js` | `User signs out` |
| US-1.4 | Reusing a token after sign out fails | `backend/tests/auth.test.js` | `Reusing a token after sign out fails` |
| US-1.5 | Unauthenticated user accesses a protected route | `frontend/tests/router.test.js` | `Unauthenticated user accesses a protected route` |
| US-1.5 | Protected API request without a token | `backend/tests/authenticate.test.js` | `Protected API request without a token` |
| US-1.6 | Seeded admin signs in with Google and receives the admin role | `backend/tests/auth.test.js` | `Seeded admin signs in with Google and receives the admin role` |
| US-1.6 | User is rejected by the admin guard | `backend/tests/authenticate.test.js` | `User is rejected by the admin guard` |
| US-1.6 | Admin passes the admin guard | `backend/tests/authenticate.test.js` | `Admin passes the admin guard` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 1 from @features/feature-1-google-auth.md on branch `features/1-google-auth`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-001**–**FR-013** satisfied)
*   [ ] **Success Criteria (SC-001**–**SC-004)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete (16 scenarios, 16 matching `it` names)
*   [x] `features/reference/data-model.md` updated — `users`, `sessions`
*   [x] `features/reference/api.md` updated — `POST /vehicles/auth/google` and logout
*   [x] `features/reference/behavior.md` updated — identity, session, access, validation, UI rules

---

## Delivered to later features

*   `authenticate` and `requireAdmin` middleware for later features.
*   `req.user = { id, role }` on every protected request.
*   The `home` placeholder is temporary; the feature that introduces `MenuBar` replaces it and relocates **Sign out**.

---

## Out of Scope

*   Password reset and email verification

