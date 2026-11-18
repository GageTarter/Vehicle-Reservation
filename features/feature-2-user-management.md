# Feature: User Management

**Feature ID:** 2
**Branch pattern:** `features/2-user-management`
**Status:** Draft
**Created:** 2026-11-02
**Input:** A signed-in user can view their account, edit their name, delete the account, or sign out. A system admin or area admin can list users and set each user to one role.
**Depends on:** [Feature 1 — Google Authentication](feature-1-google-auth.md)

---

## User Stories

### US-2.1: View my account
**As a** signed-in user
**I want to** view my account
**So that** I can see my account information

**Priority:** P1
**Independent test:** a signed-in user opens `account` and sees their email, first name, last name, and role. No other user's data is shown.
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: Edit my name
**As a** signed-in user
**I want to** edit my first and last name and save the changes
**So that** the information reflects the most accurate data

**Priority:** P1
**Independent test:** saving a new first and last name returns `200`, the `users` row changes, and `localStorage` `user` shows new names
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: Delete my account
**As a** signed-in user
**I want** to delete my account
**So that** my account and login is no longer in the system

**Priority:** P1
**Independent test:** confirming delete removes that user and their sessions, clears `localStorage`, and lands on `login`. The old token then gets `401`
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: Sign out
**As a** signed-in user
**I want to** sign out
**So that** no one else can use my account on a shared device

**Priority:** P2
**Independent test:** Sign out on the account page calls the existing logout endpoint, clears `localStorage`, and lands on `login`
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

### US-2.5: View users
**As a** system admin or area admin
**I want to** view every user account
**So that** I can see who has access

**Priority:** P1
**Independent test:** an `admin` or `area_admin` opens `users` and sees each user's name, email, and role. A `user` or `maintenance` account is sent home and `GET /vehicles/users` returns `403`.
**Acceptance scenarios:** see ### US-2.5 under Acceptance Criteria

### US-2.6: Assign one role
**As a** system admin or area admin
**I want to** set a user's role to one allowed value
**So that** that person has the access their job needs

**Priority:** P1
**Independent test:** `PUT /vehicles/users/:id/role` with one of `user`, `admin`, `area_admin`, or `maintenance` returns `200` and stores that role. Any other role returns `400` and leaves the row unchanged. A requestor receives `403`.
**Acceptance scenarios:** see ### US-2.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: A signed-in user MUST be ablevto view only their own account: `userId`, `email`, `fName`, `lName`, and `role`
- **FR-002**: The user MUST be able to change only `fName` and `lName`. The API MUST ignore `email`, `googleId`, and `role`.
- **FR-003**: A successful name update MUST be stored on that user's `users` row and MUST update the `user` object in `localStorage`
- **FR-004**: `fName` and `lName` MUST be strings. Either may be empty. A missing or non-string MUST return `400`
- **FR-005**: Deleting the account MUST delete that `users` row and every `sessions` row for that user.
- **FR-006**: After a successful delete, the client MUST remove `localStorage` key `user` and redirect to `login`
- **FR-007**: Account routes MUST use the existing `authenticate` middleware. No token MUST return `401`
- **FR-008**: `GET`, `PUT`, and `DELETE /vehicles/me` MUST resolve the user from `req.user.id`. They MUST NOT accept a user id from the client
- **FR-009**: Sign out on the account page MUST call the existing `POST` `/vehicles/logout`, then clear `localStorage` and redirect to `login`
- **FR-010**: `GET /vehicles/users` MUST return every user as `userId`, `email`, `fName`, `lName`, and `role`, ordered by `email` ascending. The caller MUST be `admin` or `area_admin`. A signed-in `user` or `maintenance` caller MUST receive `403`
- **FR-011**: `PUT /vehicles/users/:id/role` MUST set that user's `role` to exactly one of `user`, `admin`, `area_admin`, or `maintenance`. The caller MUST be `admin` or `area_admin`. Any other role MUST return `400` and MUST leave the row unchanged
- **FR-012**: The role endpoint MUST write only `role`. It MUST ignore `email`, `googleId`, `fName`, and `lName`. A missing user MUST return `404`. This feature MUST NOT create a user, delete another user, or assign more than one role

---

## Assumptions

- Feature 1 is already available: Google sign-in, `users`, `sessions`, `authenticate`, and `POST /vehicles/logout`.
- The account was created by Google sign-in. This feature does not create a user or collect a `googleId`.
- Feature 1 still defaults a new Google sign-in to `role` `user`, and the seed script still creates the first `admin`. Feature 2 is how an `admin` or `area_admin` changes `role` after that.
- One `users.role` value per user. There is no `roles` table and no `user_roles` table.
- One `localStorage` session per browser.
- Assigning `area_admin` or `maintenance` does not change Feature 8. Only `role` `admin` lists every reservation and assigns vehicles. Area-admin and maintenance powers stay in Features 12–15.
- Driver approval stays on the Feature 4 driver list. Area assignment waits for the Area spec.

## Edge Cases

- Cancel edit → stay on the account page, no API call, names unchanged
- Cancel delete → stay on the account page, no API call, account still exists
- Request body includes `role`, `email`, or `googleId` → those fields are unchanges
- No token, or a token from a deleted account → `401`, `localStorage` cleared, redirect to `login`
- Signed-out visitor opens `account` or `users` → redirect to `login`
- `user` or `maintenance` opens `users` → redirect to `home`, and the API returns `403`
- Role value outside `user`, `admin`, `area_admin`, and `maintenance` → `400`, stored role unchanged
- Role update for an id that is not in `users` → `404`
- Role request includes `email` or `fName` → those fields stay unchanged

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in user can open their account, change both names, see the new names after refresh, delete the account, and land on login.
- **SC-003**: `npm test` passes with backendand and frontend router.
- **SC-004**: An `admin` or `area_admin` can open the user list and change one user's role. A requestor cannot.

---

## Data Ownership & Isolation (foundation)

Feature 1 establishes identity and role; Other features enforce the data boundaries built on it.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /vehicles/me` returns only the row for `req.user.id` |
| **Write scope** | Name update and delete apply only to `req.user.id` |
| **Identity fields** | `/vehicles/me` never writes `googleId`, `email`, or `role`. `PUT /vehicles/users/:id/role` writes only `role` |
| **Cross-user access** | `GET /vehicles/users` and `PUT /vehicles/users/:id/role` are the only cross-user operations. They do not edit another user's name or email and do not delete another user |
| **Role assignment** | Caller must be `admin` or `area_admin`. One role per user |
| **Delete** | Deleting the user deletes that user's sessions |
| **UI Scope** | The account page renders only the payload from `GET /vehicles/me` |
| **Implementation** | Use authenticate from backend/app/authorization/authorization.js. Do not reimplement it. |

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/vehicles/me` | Yes | Return the signed-in user's account |
| `PUT` | `/vehicles/me` | Yes | Update `fName` and `lName` |
| `DELETE` | `/vehicles/me` | Yes | Delete the signed-in user and their sessions |
| `GET` | `/vehicles/users` | `admin` or `area_admin` | List every user |
| `PUT` | `/vehicles/users/:id/role` | `admin` or `area_admin` | Set that user's one role |

**PUT body:**
```json
{ "fName": "Janet", "lName": "Doe" }
```

**GET and PUT success response** (200):
```json
{
  "userId": 1,
  "email": "jane@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "user"
}
```

**DELETE success (200):** `{ "message": "Account deleted." }`

**Validation error (400):** `{ "message": "First and last name must be text." }`

**Unauthenticated (401):** `{ "message": "Unauthorized! No token provided." }`

| Status | Used for |
|--------|----------|
| `200` | `GET`, `PUT`, or `DELETE /vehicles/me` succeeded |
| `400` | `fName` or `lName` is missing or not a string |
| `401` | Missing, expired, or unknown session token |

**PUT `/vehicles/users/:id/role` body:**
```json
{ "role": "maintenance" }
```

**Success (200):** the same account shape as `GET /vehicles/me` for that user.

**List success (200):** an array of those account objects, ordered by `email` ascending.

**Invalid role (400):** `{ "message": "Role must be user, admin, area_admin, or maintenance." }`

**Forbidden (403):** `{ "message": "Forbidden! User management access required." }`

**Missing user (404):** `{ "message": "User with id=<id> not found." }`

| Status | Used for |
|--------|----------|
| `200` | User list or role update succeeded |
| `400` | `role` is missing or not one of the four allowed values |
| `401` | Missing, expired, or unknown session token |
| `403` | Signed-in caller is not `admin` or `area_admin` |
| `404` | No `users` row for `:id` |

---

## Screen Requirements

### [View: Account] — route name `account`
*   Protected. The existing router guard sends a signed-out visitor to `login`
*   Shows email and role as read-only. Role stays a `<v-chip>`
*   Shows first name and last name
*   Edit opens the name fields. Save submits the PUT. Cancel closes edit with no request
*   Delete account asks for confirmation. Confirm sends DELETE. Cancel sends nothing.
*   Sign out is a `v-btn` on this page and calls the existing logout flow
*   Failures render `<v-alert type="error" density="Compact">` with the server message

### [View: Home] — route name `home`
*   Keep the welcome message and role chip from Feature 1
*   Add a My account action that routes to `account`
*   Remove Sign out from home. It now lives on `account`, which is the move Feature 1 deferred

### [View: User Management] — route name `users`
*   Protected. A signed-out visitor goes to `login`. A `user` or `maintenance` account goes to `home`
*   The existing `MenuBar` shows **Users** (`:to="{ name: 'users' }"`) only when `role` is `admin` or `area_admin`. This feature does not add a new `MenuBar`
*   Lists every user: name, email, and role
*   Each row can set `role` to one of `user`, `admin`, `area_admin`, or `maintenance`, then save with `PUT /vehicles/users/:id/role`
*   Failures render `<v-alert type="error" density="compact">` with the server message
*   This route is not `drivers`. `drivers` stays the Feature 4 driver catalogue

---

## Key Entities

- **User**: a Google-backed account with `googleId`, email, name, and role `user` or `admin`.
- **Session**: a server-side record tying a JWT token to a user; expires 24 hours after creation.

---

## Data Model Requirements

### `users` table
| Field | Type | Rules |
|-------|------|-------|
| `fName` | STRING | From `given_name`; may be empty |
| `lName` | STRING | From `family_name`; may be empty |
| `role` | STRING(20) | Required. Exactly one of `user`, `admin`, `area_admin`, `maintenance`. Google sign-in still defaults to `user`. This feature writes `role` only through `PUT /vehicles/users/:id/role` |

`fName` and `lName` are written only by `PUT /vehicles/me`. `role` is written only by the role endpoint. No new tables. The rest of `users` and `sessions` stay as in features/reference/data-model.md

### Associations
*   `User hasMany Session`
*   `Session belongsTo User`

Associations are wired in `backend/app/models/index.js`, not in controllers.

---

## Acceptance Criteria (Gherkin)

### US-2.1 — View my account

#### Scenario: User views account
*   **Given** I am signed in as `jane@example.com` with first name `Jane`, last name `Doe`, and role `user`
*   **And** I am on the home page
*   **When** I click on **My account**
*   **Then** `GET /vehicles/me` returns `200` with `userId`, `email`, `fName`, `lName`, and `role`
*   **And** the returned `email` is `jane@example.com`
*   **And** the returned `fName` is `Jane`
*   **And** the returned `lName` is `Doe`
*   **And** the returned `role` is `user`
*   **And** the account page shows those values

#### Scenario: Signed-out user opens account
*   **Given** I have no session in `localStorage`
*   **When** I navigate directly to the account page
*   **Then** I am redirected to the login page

#### Scenario: Account request without a token
*   **Given** I have no session token
*   **When** I send `GET /vehicles/me`
*   **Then** the API returns `401` with `{ "message": "Unauthorized! No token provided." }`

---

### US-2.2 — Edit my name

#### Scenario: User saves a new name
*   **Given** I am signed in on the account page
*   **And** my first name is `Jane` and my last name is `Doe`
*   **When** I change my first name to `Janet` and my last name to `Doe`
*   **And** I click **Save**
*   **Then** `PUT /vehicles/me` returns `200` with `fName` `Janet` and `lName` `Doe`
*   **And** my `users` row stores `fName` `Janet` and `lName` `Doe`
*   **And** my `email` and `role` are unchanged
*   **And** `localStorage` key `user` shows `fName` `Janet` and `lName` `Doe`

#### Scenario: Name update ignores role and email
*   **Given** I am signed in with role `user` and email `jane@example.com`
*   **When** I `PUT /vehicles/me` with `fName` `Janet`, `lName` `Doe`, `"role": "admin"`, and `"email": "other@example.com"`
*   **Then** the API returns `200`
*   **And** the stored `role` is `user`
*   **And** the stored `email` is `jane@example.com`

#### Scenario: Non-text name is rejected
*   **Given** I am signed in
*   **When** I `PUT /vehicles/me` with `fName` set to a number
*   **Then** the API returns `400` with `{ "message": "First and last name must be text." }`
*   **And** my `users` row is unchanged

#### Scenario: User cancels edit
*   **Given** I am on the account page
*   **And** I have opened edit
*   **When** I click **Cancel**
*   **Then** I remain on the account page
*   **And** no API request is sent
*   **And** my names are unchanged

---

### US-2.3 — Delete my account

#### Scenario: User deletes their account
*   **Given** I am signed in on the account page
*   **When** I confirm **Delete account**
*   **Then** `DELETE /vehicles/me` returns `200` with `{ "message": "Account deleted." }`
*   **And** my `users` row is removed
*   **And** my `sessions` rows are removed
*   **And** `localStorage` key `user` is removed
*   **And** I am redirected to the login page

#### Scenario: Reusing a token after delete fails
*   **Given** I have deleted my account
*   **When** I replay my previous Bearer token against `GET /vehicles/me`
*   **Then** the API returns `401`

#### Scenario: User cancels delete
*   **Given** I am on the account page
*   **And** the delete confirmation is open
*   **When** I cancel delete
*   **Then** I remain on the account page
*   **And** my user record still exists
*   **And** no API request is sent

---

### US-2.4 — Sign out

#### Scenario: User signs out
*   **Given** I am signed in on the account page
*   **When** I click **Sign out**
*   **Then** the API invalidates my session token on the server
*   **And** `localStorage` key `user` is removed
*   **And** I am redirected to the login page

#### Scenario: Reusing a token after sign out fails
*   **Given** I have signed out
*   **When** I replay my previous Bearer token against a protected route
*   **Then** the API returns `401`

---

### US-2.5 — View users

#### Scenario: Administrator views users
*   **Given** I am signed in as an `admin`
*   **And** a user `jane@example.com` exists with role `user`
*   **When** I open User Management
*   **Then** `GET /vehicles/users` returns `200`
*   **And** the list includes `jane@example.com` with that user's name and role `user`
*   **And** the page shows those values

#### Scenario: Area admin views users
*   **Given** I am signed in as an `area_admin`
*   **When** I send `GET /vehicles/users`
*   **Then** the API returns `200` with every user

#### Scenario: Requestor cannot view users
*   **Given** I am signed in with role `user`
*   **When** I open User Management
*   **Then** I am redirected to `home`
*   **And** `GET /vehicles/users` returns `403` with `{ "message": "Forbidden! User management access required." }`

#### Scenario: User list request without a token
*   **Given** I have no session token
*   **When** I send `GET /vehicles/users`
*   **Then** the API returns `401` with `{ "message": "Unauthorized! No token provided." }`

---

### US-2.6 — Assign one role

#### Scenario: Administrator assigns a role
*   **Given** I am signed in as an `admin`
*   **And** a user exists with role `user`
*   **When** I `PUT /vehicles/users/:id/role` with `{ "role": "maintenance" }`
*   **Then** the API returns `200` with `role` `maintenance`
*   **And** that `users` row stores `role` `maintenance`
*   **And** that user's `email` and name are unchanged

#### Scenario: Area admin assigns a role
*   **Given** I am signed in as an `area_admin`
*   **And** a user exists with role `user`
*   **When** I `PUT /vehicles/users/:id/role` with `{ "role": "area_admin" }`
*   **Then** the API returns `200`
*   **And** the stored `role` is `area_admin`

#### Scenario: Requestor cannot assign a role
*   **Given** I am signed in with role `user`
*   **When** I `PUT /vehicles/users/:id/role` with `{ "role": "admin" }`
*   **Then** the API returns `403` with `{ "message": "Forbidden! User management access required." }`
*   **And** the stored `role` is unchanged

#### Scenario: Invalid role is rejected
*   **Given** I am signed in as an `admin`
*   **And** a user exists with role `user`
*   **When** I `PUT /vehicles/users/:id/role` with `{ "role": "driver" }`
*   **Then** the API returns `400` with `{ "message": "Role must be user, admin, area_admin, or maintenance." }`
*   **And** the stored `role` is `user`

#### Scenario: Role update for a missing user
*   **Given** I am signed in as an `admin`
*   **When** I `PUT /vehicles/users/99999/role` with `{ "role": "user" }`
*   **Then** the API returns `404` with `{ "message": "User with id=99999 not found." }`

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-2.1 | User views account | `backend/tests/account.test.js`, `frontend/tests/Account.test.js` | `User views account` |
| US-2.1 | Signed-out user opens account | `frontend/tests/router.test.js` | `Signed-out user opens account` |
| US-2.1 | Account request without a token | `backend/tests/account.test.js` | `Account request without a token` |
| US-2.2 | User saves a new name | `backend/tests/account.test.js`, `frontend/tests/Account.test.js` | `User saves a new name` |
| US-2.2 | Name update ignores role and email | `backend/tests/account.test.js` | `Name update ignores role and email` |
| US-2.2 | Non-text name is rejected | `backend/tests/account.test.js` | `Non-text name is rejected` |
| US-2.2 | User cancels edit | `frontend/tests/Account.test.js` | `User cancels edit` |
| US-2.3 | User deletes their account | `backend/tests/account.test.js`, `frontend/tests/Account.test.js` | `User deletes their account` |
| US-2.3 | Reusing a token after delete fails | `backend/tests/account.test.js` | `Reusing a token after delete fails` |
| US-2.3 | User cancels delete | `frontend/tests/Account.test.js` | `User cancels delete` |
| US-2.4 | User signs out | `frontend/tests/Account.test.js` | `User signs out` |
| US-2.4 | Reusing a token after sign out fails | `backend/tests/account.test.js` | `Reusing a token after sign out fails` |
| US-2.5 | Administrator views users | `backend/tests/users.test.js`, `frontend/tests/Users.test.js` | `Administrator views users` |
| US-2.5 | Area admin views users | `backend/tests/users.test.js` | `Area admin views users` |
| US-2.5 | Requestor cannot view users | `backend/tests/users.test.js`, `frontend/tests/Users.test.js` | `Requestor cannot view users` |
| US-2.5 | User list request without a token | `backend/tests/users.test.js` | `User list request without a token` |
| US-2.6 | Administrator assigns a role | `backend/tests/users.test.js`, `frontend/tests/Users.test.js` | `Administrator assigns a role` |
| US-2.6 | Area admin assigns a role | `backend/tests/users.test.js` | `Area admin assigns a role` |
| US-2.6 | Requestor cannot assign a role | `backend/tests/users.test.js` | `Requestor cannot assign a role` |
| US-2.6 | Invalid role is rejected | `backend/tests/users.test.js` | `Invalid role is rejected` |
| US-2.6 | Role update for a missing user | `backend/tests/users.test.js` | `Role update for a missing user` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 2 from @features/feature-2-user-management.md on branch `features/2-user-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Preserve the existing personal account behavior (US-2.1 through US-2.4).
Add the user list and single-role assignment (US-2.5 and US-2.6).
Do not add driver approval, areas, destinations, or more than one role per user.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

*   [x] Personal account implemented per **FR-001**–**FR-009** (US-2.1 through US-2.4)
*   [x] User list and single-role assignment implemented per **FR-010**–**FR-012** (US-2.5 and US-2.6)
*   [x] **SC-002** met for the personal account
*   [x] **SC-001**, **SC-003**, and **SC-004** met, including the new user-list and role scenarios
*   [x] Personal-account tests pass
*   [x] Test Coverage Map complete for US-2.5 and US-2.6
*   [x] `features/reference/data-model.md` updated — `fName` and `lName` may change; deleting a user deletes that user's sessions
*   [x] `features/reference/data-model.md` updated — `users.role` may be `user`, `admin`, `area_admin`, or `maintenance`
*   [x] `features/reference/api.md` updated — `GET`, `PUT`, and `DELETE /vehicles/me`
*   [x] `features/reference/api.md` updated — `GET /vehicles/users` and `PUT /vehicles/users/:id/role`
*   [x] `features/reference/behavior.md` updated — account view, name edit, self-delete, and **Sign out** on the account page
*   [x] `features/reference/behavior.md` updated — admin and area admin can list users and set one role

---

## Delivered to later features

*   `GET`, `PUT`, and `DELETE /vehicles/me` for the signed-in user.
*   The `account` route, linked from home as **My account**.
*   **Sign out** lives on the account page.

*   `GET /vehicles/users` and `PUT /vehicles/users/:id/role` for an `admin` or `area_admin`.
*   The `users` route, linked from the menu as **Users**.

---

## Out of Scope

*   Creating an account or signing in with Google
*   Changing `email` or `googleId`
*   A signed-in user changing their own `role` through `PUT /vehicles/me`
*   Password reset and email verification
*   Deleting any account other than the signed-in user's
*   Introducing a `MenuBar`
*   Driver approval, the `drivers` route, areas, and destinations
*   More than one role on a user
*   Deactivating an account without deleting it

