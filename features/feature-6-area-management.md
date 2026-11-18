# Feature: Area Management

**Feature ID:** 6
**Branch pattern:** `feature-6-area-management`
**Status:** Draft
**Created:** 2026-11-17
**Input:** areas created and managed by the users with admin privelages
**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories
### US-6.1: Add a area
**As a** admin
**I want to** add a area with a required name, address line 1, city, state, and zip, and an optional address line 2
**So that** I can use it during enrollment
**Priority:** P1
**Independent test:** Submit the Add area dialogue and see the area in the areas table
**Acceptance scenarios:** see ### US-6.1 under Acceptance Criteria

### US-6.2: Browse the areas list
**As a** signed-in user
**I want to** see every area with its name, address line 1, address line 2, city, state, and zip
**So that** I can see what areas are already in the system
**Priority:** P1
**Independent test:** Open the areas page and confirm each row shows name, address line 1, address line 2, city, state, and zip
**Acceptance scenarios:** see ### US-6.2 under Acceptance Criteria

### US-6.3: Correct a area's data
**As a** admin
**I want to** edit a area's name, address line 1, address line 2, city, state, and zip
**So that** the area entries contain updated data
**Priority:** P2
**Independent test:** Edit one area's name, address line 1, address line 2, city, state, and zip and confirm the table shows the new value
**Acceptance scenarios:** see ### US-6.3 under Acceptance Criteria

### US-6.4: Remove a area
**As a** admin
**I want to** remove a area that is no longer provided
**So that** the old areas are not listed
**Priority:** P3
**Independent test:** Delete an unused area and confirm it leaves the areas table
**Acceptance scenarios:** see ### US-6.4 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** An admin must fill `name`, `addressLine1`, `city`, `state`, and `zip`. `addressLine2` is optional.
-- **FR-002:** Created areas are shared. Only signed-in admin users can view every area. No area belongs to a specific user. A signed-in non-admin MUST receive `403` on `GET /areaapi/areas`.
-- **FR-003:** Only an admin can view, create, edit, or delete a area. 
-- **FR-004:** On edit, `name`, `addressLine1`, `city`, `state`, and `zip`. `addressLine2` is optional; a blank value clears that field.
-- **FR-005:** Edited information must be updated in the affected area when a user with admin privelages makes a change.
-- **FR-006:** area must be completely erased when the delete option is selected by the user with admin privelages.
-- **FR-007:** Created areas must be listed in alphabetical order.

---

## Assumptions

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.

## Edge Cases
- Empty or whitespace-only `name` → `400`.
- `name` longer than 100 characters → `400`.
- Leading and trailing whitespace on `name` is trimmed before validation and storage.
- Non-numeric `:id` → `400`.
- `:id` that does not match an existing area → `404`.

## Success Criteria
- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Every signed-in user can view every area on one screen. An admin can create, edit, and delete areas on that screen.
- **SC-003**: `npm test` passes for area API and dashboard areas-view behavior.

## Data Ownership & Isolation

Areas are a shared catalogue. An area has no owner and no `userId`. Every signed-in user sees the same rows (**FR-002**). Only an admin can create, edit, or delete (**FR-003**).

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /areaapi/areas` returns every area, ordered by `name` ascending (**FR-007**). Do not filter by `req.user.id` |
| **Write scope** | `PUT` / `DELETE /areaapi/areas/:id` update or erase the row with that primary key. Missing id → `404`. Caller must be an admin |
| **Create scope** | `POST /areaapi/areas` inserts a shared row. Do not set `userId` from the session or the body. Caller must be an admin |
| **Non-admin write** | A signed-in user who is not an admin → `403` on `POST`, `PUT`, and `DELETE` |
| **UI scope** | `areaList.vue` shows the full list from the API. Show **+ New area**, **Edit area**, and **Delete area** only when the signed-in user is an admin |
| **Implementation** | Protect all four routes with `authenticateRoute`. Protect `POST`, `PUT`, and `DELETE` with `requireAdmin`. Do not scope queries by `req.user.id` |

Unauthenticated callers → `401`.

## Key Entities

-- **area** shared catalogue entry. It has no owner.

## API Requirements

Mount prefix is `/areaapi` (existing `server.js` + `areaServices.js`). Paths below match `backend/app/routes/area.routes.js`. All four endpoints require `Authorization: Bearer <token>`.

JSON property `areaID` matches the running app, the Data Model column `areaID`, and Gherkin.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/areaapi/areas` | Yes | List every area, alphabetical by `name` (**FR-002**, **FR-007**, US-6.2) |
| `POST` | `/areaapi/areas` | Admin | Create a area (**FR-001**, **FR-003**, US-6.1) |
| `PUT` | `/areaapi/areas/:id` | Admin | Replace name of an existing area (**FR-004**, **FR-005**, US-6.3) |
| `DELETE` | `/areaapi/areas/:id` | Admin | Erase an existing area (**FR-003**, **FR-006**, US-6.4) |

`:id` is the numeric primary key. Non-numeric `:id` → `400` (Edge Cases). `areaID` is the separate string field (example `CMSC-1113-01`).

This feature does **not** add `GET /areaapi/areas/:id` or `DELETE /areaapi/areas` (delete-all). Those exist in the current backend but are not authorized by these FRs/Gherkin.

**Create request body:** `name` is required.
```json
{ "name": "Athletics"}
```

**Create success** (`201`):
```json
{ "name": "Athletics"}
```

**Update request body:** On edit, `name`. (**FR-004**).

**Update success** (`200`) — same body the running app returns today:
```json
{ "message": "Area was updated successfully." }
```

**Delete success:** `200` or `204` (US-6.4). No requirement to return a message body.

**List success** (`200`): array of every area, sorted by `name` ascending. Empty catalogue → `[]`.

**Error response:** `{ "message": "Human-readable explanation." }`  
**Quoted validation (AC):**
- Empty or whitespace-only `name` → `400` `{ "message": "area name is required." }`
- `name` longer than 100 characters → `400` `{ "message": "area name must be 100 characters or fewer." }`
- Missing area id → `404` `{ "message": "area not found." }`
- Signed-in non-admin `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin privileges are required." }`

**Other errors:** omitted, empty, or whitespace-only `addressLine2` → stored as `null`; unauthenticated → `401`. Flat JSON — no `{ success, data }` envelope.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Primary labeled CTAs use class `oc-cta`. Errors that Gherkin names use `<v-alert type="error">`.

### [View: areas] — route name `areas`

*   **Route:** `/areas` → `frontend/src/views/areaList.vue` (existing `router.js`).
*   **Heading:** **areas**
*   **Purpose:** One screen where every signed-in user browses every area, and an admin creates, edits, and deletes areas (**SC-002**).
*   **Primary action:** **+ New area** (`oc-cta`) — opens the add dialog (US-6.1).
*   **Table columns:** Name. Each row shows that area's name, which is required. (US-6.2).
*   **Row actions (icon-only, `size="small"`):**
    *   **Edit area** — `aria-label="Edit area"`; opens the edit dialog (US-6.3).
    *   Delete icon on the row — `aria-label` **Delete area**; opens the delete confirm dialog (US-6.4).
*   **Add dialog:** fields: Name. Each row shows that area's name, which is required. Confirm submits create; **Close** dismisses without saving (existing dialog chrome). Dialog closes after a successful create.
*   **Edit dialog:** same one field, prefilled from the row. Confirm submits update; **Close** dismisses. Dialog closes after a successful update. Click target and title use **Edit area**.
*   **Delete dialog:** confirm then call `DELETE`; cancel/close leaves the row in place.
*   **Inline validation** (no API request) — exact AC copy:
    *   **"Area name is required."**
*   **Empty state:** when no areas exist, the table shows no area rows (US-6.2 — "no areas should be displayed").
*   **Loading:** table or page loading indicator while `getareas` is in flight.
*   **Error:** API failures and quoted `400` messages display in `<v-alert type="error">`.

**App chrome**

*   Existing `MenuBar` **areas** button (`:to="{ name: 'areas' }"`) is how US-6.2 "open the areas menu" is reached. This feature does not add a new nav item.
*   MenuBar stays hidden on login (Feature 1). Area navigation stays on Feature 6.

## Data Model Requirements

### `areas` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | PK, auto-increment |
| `name` | STRING(100) | Required. Unique. At most 100 characters. Stored and displayed as typed |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

This feature does not associate **area** with **User**. areas have no owner and no `userId` column.

## Acceptance Criteria (Gherkin)

### US-6.1 — Add a catalogue area
#### Scenario: User creates a new area
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **+ New area**
*   **And** I enter area name `Athletics`
*   **And** I confirm the dialog
*   **Then** the API returns `201` with a area object containing `id` and `name`
*   **And** `Athletics` appears in the areas view
*   **And** the add-area dialog closes

#### Scenario: User creates an area with an empty name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new area dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Area name is required."**
*   **And** no API request is sent

#### Scenario: User creates an area with an existing name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new area dialog
*   **And** I fill the area name with the name of an existing area
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Area name is in use. Enter a different area name."**
*   **And** no API request is sent

#### Scenario: User creates an area with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a area name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "Area name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: Non-admin cannot create a area
*   **Given** I am signed in as a non-admin
*   **When** I send `POST /areaapi/areas` with a name, address line 1, city, state, and zip
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the area is not created

---

### US-6.2 — Browse the area List
#### Scenario: User views existing areas
*   **Given** I am signed in on the dashboard
*   **When** I open the areas menu
*   **Then** existing areas are displayed in alphabetical order

#### Scenario: There are no existing areas
*   **Given** I am signed in on the dashboard
*   **When** I open the areas menu
*   **Then** no areas should be displayed

### US-6.3 — Correct an area's name
#### Scenario: User edits an area's information
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **Edit area** on an existing area
*   **And** I change the original value
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "area was updated successfully." }`
*   **And** the area is visible with updated information in the areas view
*   **And** the edit-area dialog closes

#### Scenario: User clears an area's name

*   **Given** I am signed in as an admin on the dashboard
*   **And** an area has a name
*   **When** I open the edit area dialog
*   **And** I leave name filled
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "Area was updated successfully." }`
*   **And** that area's `name` is in the areas view

#### Scenario: User edits an area with an empty name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit area dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Area name is required."**
*   **And** no API request is sent

#### Scenario: User edits an area with an existing name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit area dialog
*   **And** I enter the name of a different existing area
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Area name is in use. Enter a different area name."**
*   **And** no API request is sent

#### Scenario: User edits a area with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a area name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "Area name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User updates an area that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `PUT /areaapi/areas/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "Area not found." }`
*   **And** no area is changed

#### Scenario: Non-admin cannot edit a area
*   **Given** I am signed in as a non-admin
*   **And** an area exists
*   **When** I send `PUT /areaapi/areas/:id` for that area
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the area is unchanged

### US-6.4 Remove an area
#### Scenario: User removes an area
*   **Given** I am signed in as an admin
*   **And** I have access to area `Athletics`
*   **When** I click the delete icon on the `Athletics` row
*   **And** I confirm the delete dialog
*   **Then** the API returns `200` or `204`
*   **And** the area is removed from the areas view

#### Scenario: User deletes an area that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `DELETE /areaapi/areas/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "Area not found." }`
*   **And** no area is removed

#### Scenario: Non-admin cannot remove an area
*   **Given** I am signed in as a non-admin
*   **And** an area named `Athletics` exists
*   **When** I send `DELETE /areaapi/areas/:id` for that area
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** `Athletics` is still listed

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-6.1 | User creates a new area | `backend/tests/areas.test.js`; `frontend/tests/areaList.test.js` | `it("User creates a new area")` |
| US-6.1 | User creates an area with an empty name | `frontend/tests/areaList.test.js` | `it("User creates an area with an empty name")` |
| US-6.1 | User creates an area with an existing name | `frontend/tests/areaList.test.js` | `it("User creates an area with an existing name")` |
| US-6.1 | User creates an area with a name that is too long | `backend/tests/areas.test.js`; `frontend/tests/areaList.test.js` | `it("User creates an area with a name that is too long")` |
| US-6.1 | Non-admin cannot create an area | `backend/tests/areas.test.js` | `it("Non-admin cannot create an area")` |
| US-6.2 | User views existing areas | `backend/tests/areas.test.js`; `frontend/tests/areaList.test.js` | `it("User views existing areas")` |
| US-6.2 | There are no existing areas | `frontend/tests/areaList.test.js` | `it("There are no existing areas")` |
| US-6.3 | User edits an area's information | `backend/tests/areas.test.js`; `frontend/tests/areaList.test.js` | `it("User edits an area's information")` |
| US-6.3 | User edits an area with an empty name | `frontend/tests/areaList.test.js` | `it("User edits an area with an empty name")` |
| US-6.3 | User edits an area with an existing name | `frontend/tests/areaList.test.js` | `it("User edits an area with an existing name")` |
| US-6.3 | User edits an area with a name that is too long | `backend/tests/areas.test.js`; `frontend/tests/areaList.test.js` | `it("User edits an area with a name that is too long")` |
| US-6.3 | User updates an area that does not exist | `backend/tests/areas.test.js` | `it("User updates an area that does not exist")` |
| US-6.3 | Non-admin cannot edit an area | `backend/tests/areas.test.js` | `it("Non-admin cannot edit an area")` |
| US-6.4 | User removes an area | `backend/tests/areas.test.js`; `frontend/tests/areaList.test.js` | `it("User removes an area")` |
| US-6.4 | User deletes an area with a non-numeric id | `backend/tests/areas.test.js` | `it("User deletes an area with a non-numeric id")` |
| US-6.4 | User deletes an area that does not exist | `backend/tests/areas.test.js` | `it("User deletes an area that does not exist")` |
| US-6.4 | Non-admin cannot remove an area | `backend/tests/areas.test.js` | `it("Non-admin cannot remove an area")` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 6 from @features/feature-6-area-management.md on branch `feature-6-area-management`.

Follow layer order in @feacdtures/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [x] **Success Criteria (SC-00N)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated (if schema changed)
*   [x] `features/reference/api.md` updated (if API changed)
*   [x] `features/reference/behavior.md` updated (if product rules changed)

## Out of Scope

*   Register, sign in, session persistence, and logout ([Feature 1](feature-1-user-authentification.md))
*   Bulk `DELETE /areaapi/areas` (delete-all) and `GET /areaapi/areas/:id`
*   Per-user area ownership (`userId` on `areas`)
*   Profile management
