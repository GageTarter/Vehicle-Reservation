# Feature: destination Management

**Feature ID:** 5
**Branch pattern:** `feature-5-destination-management`
**Status:** Draft
**Created:** 2026-11-14
**Input:** Destinations created and managed by the users with admin privelages
**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories
### US-5.1: Add a destination
**As a** admin
**I want to** add a destination with a required name, address line 1, city, state, and zip, and an optional address line 2
**So that** I can use it during enrollment
**Priority:** P1
**Independent test:** Submit the Add destination dialogue and see the destination in the destinations table
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Browse the destinations list
**As a** signed-in user
**I want to** see every destination with its name, address line 1, address line 2, city, state, and zip
**So that** I can see what destinations are already in the system
**Priority:** P1
**Independent test:** Open the destinations page and confirm each row shows name, address line 1, address line 2, city, state, and zip
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: Correct a destination's data
**As a** admin
**I want to** edit a destination's name, address line 1, address line 2, city, state, and zip
**So that** the destination entries contain updated data
**Priority:** P2
**Independent test:** Edit one destination's name, address line 1, address line 2, city, state, and zip and confirm the table shows the new value
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Remove a destination
**As a** admin
**I want to** remove a destination that is no longer provided
**So that** the old destinations are not listed
**Priority:** P3
**Independent test:** Delete an unused destination and confirm it leaves the destinations table
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** An admin must fill `name`, `addressLine1`, `city`, `state`, and `zip`. `addressLine2` is optional.
-- **FR-002:** Created destinations are shared. Only signed-in admin users can view every destination. No destination belongs to a specific user. A signed-in non-admin MUST receive `403` on `GET /destinationapi/destinations`.
-- **FR-003:** Only an admin can view, create, edit, or delete a destination. 
-- **FR-004:** On edit, `name`, `addressLine1`, `city`, `state`, and `zip`. `addressLine2` is optional; a blank value clears that field.
-- **FR-005:** Edited information must be updated in the affected destination when a user with admin privelages makes a change.
-- **FR-006:** destination must be completely erased when the delete option is selected by the user with admin privelages.
-- **FR-007:** Created destinations must be listed in alphabetical order.

---

## Assumptions

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.

## Edge Cases
- Empty or whitespace-only `name`, `addressLine1`, `city`, `state`, or `zip` → `400`.
- Omitted, empty, or whitespace-only `addressLine2` → accepted and stored as `null`.
- `name`, `addressLine1`, `addressLine2`, `city`, or `state` longer than 100 characters → `400`.
- `zip` that is more or less than 5 digits → `400`.
- `zip` that is a non-numerical character → `400`.
- Leading and trailing whitespace on text fields is trimmed before validation and storage.
- Non-numeric `:id` → `400`.
- `:id` that does not match an existing destination → `404`.

## Success Criteria
- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Every signed-in user can view every destination on one screen. An admin can create, edit, and delete destinations on that screen.
- **SC-003**: `npm test` passes for destination API and dashboard destinations-view behavior.

## Data Ownership & Isolation

Destinations are a shared catalogue. A destination has no owner and no `userId`. Every signed-in user sees the same rows (**FR-002**). Only an admin can create, edit, or delete (**FR-003**).

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /destinationapi/destinations` returns every destination, ordered by `name` descending (**FR-007**). Do not filter by `req.user.id` |
| **Write scope** | `PUT` / `DELETE /destinationapi/destinations/:id` update or erase the row with that primary key. Missing id → `404`. Caller must be an admin |
| **Create scope** | `POST /destinationapi/destinations` inserts a shared row. Do not set `userId` from the session or the body. Caller must be an admin |
| **Non-admin write** | A signed-in user who is not an admin → `403` on `POST`, `PUT`, and `DELETE` |
| **UI scope** | `destinationList.vue` shows the full list from the API. Show **+ New destination**, **Edit destination**, and **Delete destination** only when the signed-in user is an admin |
| **Implementation** | Protect all four routes with `authenticateRoute`. Protect `POST`, `PUT`, and `DELETE` with `requireAdmin`. Do not scope queries by `req.user.id` |

Unauthenticated callers → `401`.

## Key Entities

-- **destination** shared catalogue entry. It has no owner.

## API Requirements

Mount prefix is `/destinationapi` (existing `server.js` + `destinationServices.js`). Paths below match `backend/app/routes/destination.routes.js`. All four endpoints require `Authorization: Bearer <token>`.

JSON property `destinationID` matches the running app, the Data Model column `destinationID`, and Gherkin.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/destinationapi/destinations` | Yes | List every destination, alphabetical by `name` (**FR-002**, **FR-007**, US-5.2) |
| `POST` | `/destinationapi/destinations` | Admin | Create a destination (**FR-001**, **FR-003**, US-5.1) |
| `PUT` | `/destinationapi/destinations/:id` | Admin | Replace name, address line 1, address line 2, city, state, and zip of an existing destination (**FR-004**, **FR-005**, US-5.3) |
| `DELETE` | `/destinationapi/destinations/:id` | Admin | Erase an existing destination (**FR-003**, **FR-006**, US-5.4) |

`:id` is the numeric primary key. Non-numeric `:id` → `400` (Edge Cases). `destinationID` is the separate string field (example `CMSC-1113-01`).

This feature does **not** add `GET /destinationapi/destinations/:id` or `DELETE /destinationapi/destinations` (delete-all). Those exist in the current backend but are not authorized by these FRs/Gherkin.

**Create request body:** `name`, `addressLine1`, `city`, `state`, and `zip` are required. `addressLine2` may be omitted.
```json
{ "name": "Oklahoma Christian University", "addressLine1": "2501 East Memorial Road", "addressLine2": "", "city": "Edmond", "state": "Oklahoma", "zip": "73013"}
```

**Create success** (`201`):
```json
{ "name": "Oklahoma Christian University", "addressLine1": "2501 East Memorial Road", "addressLine2": "", "city": "Edmond", "state": "Oklahoma", "zip": "73013"}
```

**Update request body:** On edit, `name`, `addressLine1`, `city`, `state`, and `zip`. `addressLine2` is optional; omit them or send them blank to store `null` (**FR-004**).

**Update success** (`200`) — same body the running app returns today:
```json
{ "message": "Destination was updated successfully." }
```

**Delete success:** `200` or `204` (US-5.4). No requirement to return a message body.

**List success** (`200`): array of every destination, sorted by `name` descending. Empty catalogue → `[]`.

**Error response:** `{ "message": "Human-readable explanation." }`  
**Quoted validation (AC):**
- Empty or whitespace-only `name` → `400` `{ "message": "destination name is required." }`
- Empty or whitespace-only `addressLine1` → `400` `{ "message": "destination address line 1 is required." }`
- Empty or whitespace-only `city` → `400` `{ "message": "destination city is required." }`
- Empty or whitespace-only `state` → `400` `{ "message": "destination state is required." }`
- Empty or whitespace-only `zip` → `400` `{ "message": "destination zip is required." }`
- `name` longer than 100 characters → `400` `{ "message": "destination name must be 100 characters or fewer." }`
- `addressLine1` longer than 100 characters → `400` `{ "message": "destination address line 1 must be 100 characters or fewer." }`
- `addressLine2` longer than 100 characters → `400` `{ "message": "destination address line 2 must be 100 characters or fewer." }`
- `city` longer than 100 characters → `400` `{ "message": "destination city must be 100 characters or fewer." }`
- `state` longer than 100 characters → `400` `{ "message": "destination state must be 100 characters or fewer." }`
- `zip` that is not exactly 5 digits, or contains a non-numeric character → `400` `{ "message": "destination zip must be exactly 5 digits." }`
- Non-numeric `:id` → `400` `{ "message": "destination id must be a number." }`
- Missing destination id → `404` `{ "message": "destination not found." }`
- Signed-in non-admin `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin privileges are required." }`

**Other errors:** omitted, empty, or whitespace-only `addressLine2` → stored as `null`; unauthenticated → `401`. Flat JSON — no `{ success, data }` envelope.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Primary labeled CTAs use class `oc-cta`. Errors that Gherkin names use `<v-alert type="error">`.

### [View: destinations] — route name `destinations`

*   **Route:** `/destinations` → `frontend/src/views/destinationList.vue` (existing `router.js`).
*   **Heading:** **destinations**
*   **Purpose:** One screen where every signed-in user browses every destination, and an admin creates, edits, and deletes destinations (**SC-002**).
*   **Primary action:** **+ New destination** (`oc-cta`) — opens the add dialog (US-5.1).
*   **Table columns:** Name, AddressLine1, AddressLine2, City, State, Zip. Each row shows that destination's name, addressLine1, addressLine2, city, state, and zip (US-5.2).
*   **Row actions (icon-only, `size="small"`):**
    *   **Edit destination** — `aria-label="Edit destination"`; opens the edit dialog (US-5.3).
    *   Delete icon on the row — `aria-label` **Delete destination**; opens the delete confirm dialog (US-5.4).
*   **Add dialog:** fields: Name, address line 1, address line 2, city, State, Zip. Each row shows that destination's name, addressLine1, city, state, and zip, which are required. Address line 2 is optional. Confirm submits create; **Close** dismisses without saving (existing dialog chrome). Dialog closes after a successful create.
*   **Edit dialog:** same six fields, prefilled from the row. Name, address line 1, city, state, and zip are required. Clearing Address line 2 stores `null`. Confirm submits update; **Close** dismisses. Dialog closes after a successful update. Click target and title use **Edit destination**.
*   **Delete dialog:** confirm then call `DELETE`; cancel/close leaves the row in place.
*   **Inline validation** (no API request) — exact AC copy:
    *   **"destination name is required."**
    *   **"destination address line 1 is required."**
    *   **"destination city is required."**
    *   **"destination state is required."**
    *   **"destination zip is required."**
*   **Empty state:** when no destinations exist, the table shows no destination rows (US-5.2 — "no destinations should be displayed").
*   **Loading:** table or page loading indicator while `getdestinations` is in flight.
*   **Error:** API failures and quoted `400` messages display in `<v-alert type="error">`.

destination ID is a required field the user fills (Gherkin example `CMSC-1113-01`).

**App chrome**

*   Existing `MenuBar` **destinations** button (`:to="{ name: 'destinations' }"`) is how US-5.2 "open the destinations menu" is reached. This feature does not add a new nav item.
*   MenuBar stays hidden on login (Feature 1). estinations navigation stays on Feature 5.

## Data Model Requirements

### `destinations` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | PK, auto-increment |
| `name` | STRING(100) | Required. Unique. At most 100 characters. Stored and displayed as typed |
| `addressLine1` | STRING(100) | Required. At most 100 characters. Stored and displayed as typed |
| `addressLine2` | STRING(100) | Optional. `null` when omitted or blank. At most 100 characters when present |
| `city` | STRING(100) | Required. At most 100 characters. Stored and displayed as typed |
| `state` | STRING(100) | Required. At most 100 characters. Stored and displayed as typed |
| `zip` | STRING(5) | Required. Exactly 5 digits (`0`–`9`) |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

This feature does not associate **destination** with **User**. destinations have no owner and no `userId` column.

## Acceptance Criteria (Gherkin)

### US-5.1 — Add a catalogue destination
#### Scenario: User creates a new destination
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **+ New destination**
*   **And** I enter destination name `Oklahoma Christian University`
*   **And** I enter address line 1 `2501 East Memorial Road`
*   **And** I leave address line 2 empty
*   **And** I enter city `Edmond`
*   **And** I enter state `Oklahoma`
*   **And** I enter zip `73013`
*   **And** I confirm the dialog
*   **Then** the API returns `201` with a destination object containing `id`, `name`, `addressLine1`, `addressLine2`, `city`, `state`, and `zip`
*   **And** `addressLine2` is `null`
*   **And** `Oklahoma Christian University` appears in the destinations view
*   **And** the add-destination dialog closes

#### Scenario: User creates a destination without an address line 2
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new destination dialog
*   **And** I enter destination name `Oklahoma Christian University`
*   **And** I enter address line 1 `2501 East Memorial Road`
*   **And** I enter city `Edmond`
*   **And** I enter state `Oklahoma`
*   **And** I enter zip `73013`
*   **And** I leave address line 2 empty or whitespace only
*   **And** I confirm the dialog
*   **Then** the API returns `201`
*   **And** `addressLine2` is `null`
*   **And** `Oklahoma Christian University` appears in the destinations view

#### Scenario: User creates a destination with an empty name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new destination dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination name is required."**
*   **And** no API request is sent

#### Scenario: User creates a destination with an empty address line 1
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new destination dialog
*   **And** I leave the address line 1 field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination address line 1 is required."**
*   **And** no API request is sent

#### Scenario: User creates a destination with an empty city
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new destination dialog
*   **And** I leave the city field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination city is required."**
*   **And** no API request is sent

#### Scenario: User creates a destination with an empty state
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new destination dialog
*   **And** I leave the state field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination state is required."**
*   **And** no API request is sent

#### Scenario: User creates a destination with an empty zip
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new destination dialog
*   **And** I leave the zip field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination zip is required."**
*   **And** no API request is sent

#### Scenario: User creates a destination with an existing name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new destination dialog
*   **And** I fill the destination name with the name of an existing destination
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination name is in use. Enter a different destination name."**
*   **And** no API request is sent

#### Scenario: User creates a destination with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a destination name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a destination with an address line 1 that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit an address line 1 longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination address line 1 must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a destination with an address line 2 that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit an address line 2 longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination address line 2 must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a destination with a city that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a city longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination city must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a destination with a state that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a state longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination state must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a destination with an invalid zip
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a zip that is not exactly 5 digits, such as `7301`, `730133`, or `73O13`
*   **Then** the API returns `400` with `{ "message": "destination zip must be exactly 5 digits." }`
*   **And** the error is displayed in a `<v-alert type="error">`
*   **And** the destination is not created

#### Scenario: Non-admin cannot create a destination
*   **Given** I am signed in as a non-admin
*   **When** I send `POST /destinationapi/destinations` with a name, address line 1, city, state, and zip
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the destination is not created

---

### US-5.2 — Browse the destination List
#### Scenario: User views existing destinations
*   **Given** I am signed in on the dashboard
*   **When** I open the destinations menu
*   **Then** existing destinations are displayed in alphabetical order

#### Scenario: There are no existing destinations
*   **Given** I am signed in on the dashboard
*   **When** I open the destinations menu
*   **Then** no destinations should be displayed

### US-5.3 — Correct a destination's name, address line 1, address line 2, city, state, or zip
#### Scenario: User edits a destination's information
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **Edit destination** on an existing destination
*   **And** I change any of the original values
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "destination was updated successfully." }`
*   **And** the destination is visible with updated information in the destinations view
*   **And** the edit-destination dialog closes

#### Scenario: User clears a destination's name, address line 1, address line 2, city, state, and zip

*   **Given** I am signed in as an admin on the dashboard
*   **And** a destination has a name, an address line 1, an address line 2, a city, a state, and a zip
*   **When** I open the edit destination dialog
*   **And** I clear address line 2
*   **And** I leave name, address line 1, city, state, and zip filled
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "destination was updated successfully." }`
*   **And** that destination's `name`, `addressLine1`, `city`, `state`, and `zip` are in the destinations view

#### Scenario: User edits a destination with an empty name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit destination dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination name is required."**
*   **And** no API request is sent

#### Scenario: User edits a destination with an empty address line 1
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit destination dialog
*   **And** I leave the address line 1 field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination address line 1 is required."**
*   **And** no API request is sent

#### Scenario: User edits a destination with an empty city
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit destination dialog
*   **And** I leave the city field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination city is required."**
*   **And** no API request is sent

#### Scenario: User edits a destination with an empty state
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit destination dialog
*   **And** I leave the state field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination state is required."**
*   **And** no API request is sent

#### Scenario: User edits a destination with an empty zip
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit destination dialog
*   **And** I leave the zip field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination zip is required."**
*   **And** no API request is sent

#### Scenario: User edits a destination with an existing name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the edit destination dialog
*   **And** I enter the name of a different existing destination
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"destination name is in use. Enter a different destination name."**
*   **And** no API request is sent

#### Scenario: User edits a destination with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a destination name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits a destination with an address line 1 that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit an address line 1 longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination address line 1 must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits a destination with an address line 2 that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit an address line 2 longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination address line 2 must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits a destination with a city that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a city longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination city must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits a destination with a state that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a state longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "destination state must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User edits a destination with an invalid zip
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a zip that is not exactly 5 digits, such as `7301`, `730133`, or `73O13`
*   **Then** the API returns `400` with `{ "message": "destination zip must be exactly 5 digits." }`
*   **And** the error is displayed in a `<v-alert type="error">`
*   **And** the destination keeps its previous zip

#### Scenario: User updates a destination with a non-numeric id
*   **Given** I am signed in as an admin
*   **When** I send `PUT /destinationapi/destinations/abc`
*   **Then** the API returns `400` with `{ "message": "destination id must be a number." }`
*   **And** no destination is changed

#### Scenario: User updates a destination that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `PUT /destinationapi/destinations/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "destination not found." }`
*   **And** no destination is changed

#### Scenario: Non-admin cannot edit a destination
*   **Given** I am signed in as a non-admin
*   **And** a destination exists
*   **When** I send `PUT /destinationapi/destinations/:id` for that destination
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the destination is unchanged

### US-5.4 Remove a destination
#### Scenario: User removes a destination
*   **Given** I am signed in as an admin
*   **And** I have access to destination `Oklahoma Christian University`
*   **When** I click the delete icon on the `Oklahoma Christian University` row
*   **And** I confirm the delete dialog
*   **Then** the API returns `200` or `204`
*   **And** the destination is removed from the destinations view

#### Scenario: User deletes a destination with a non-numeric id
*   **Given** I am signed in as an admin
*   **When** I send `DELETE /destinationapi/destinations/abc`
*   **Then** the API returns `400` with `{ "message": "destination id must be a number." }`
*   **And** no destination is removed

#### Scenario: User deletes a destination that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `DELETE /destinationapi/destinations/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "destination not found." }`
*   **And** no destination is removed

#### Scenario: Non-admin cannot remove a destination
*   **Given** I am signed in as a non-admin
*   **And** a destination named `Oklahoma Christian University` exists
*   **When** I send `DELETE /destinationapi/destinations/:id` for that destination
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** `Oklahoma Christian University` is still listed

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | User creates a new destination | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a new destination")` |
| US-5.1 | User creates a destination without an address line 2 | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a destination without an address line 2")` |
| US-5.1 | User creates a destination with an empty name | `frontend/tests/destinationList.test.js` | `it("User creates a destination with an empty name")` |
| US-5.1 | User creates a destination with an empty address line 1 | `frontend/tests/destinationList.test.js` | `it("User creates a destination with an empty address line 1")` |
| US-5.1 | User creates a destination with an empty city | `frontend/tests/destinationList.test.js` | `it("User creates a destination with an empty city")` |
| US-5.1 | User creates a destination with an empty state | `frontend/tests/destinationList.test.js` | `it("User creates a destination with an empty state")` |
| US-5.1 | User creates a destination with an empty zip | `frontend/tests/destinationList.test.js` | `it("User creates a destination with an empty zip")` |
| US-5.1 | User creates a destination with an existing name | `frontend/tests/destinationList.test.js` | `it("User creates a destination with an existing name")` |
| US-5.1 | User creates a destination with a name that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a destination with a name that is too long")` |
| US-5.1 | User creates a destination with an address line 1 that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a destination with an address line 1 that is too long")` |
| US-5.1 | User creates a destination with an address line 2 that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a destination with an address line 2 that is too long")` |
| US-5.1 | User creates a destination with a city that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a destination with a city that is too long")` |
| US-5.1 | User creates a destination with a state that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a destination with a state that is too long")` |
| US-5.1 | User creates a destination with an invalid zip | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User creates a destination with an invalid zip")` |
| US-5.1 | Non-admin cannot create a destination | `backend/tests/destinations.test.js` | `it("Non-admin cannot create a destination")` |
| US-5.2 | User views existing destinations | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User views existing destinations")` |
| US-5.2 | There are no existing destinations | `frontend/tests/destinationList.test.js` | `it("There are no existing destinations")` |
| US-5.3 | User edits a destination's information | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User edits a destination's information")` |
| US-5.3 | User clears a destination's address line 2 | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User clears a destination's address line 2")` |
| US-5.3 | User edits a destination with an empty name | `frontend/tests/destinationList.test.js` | `it("User edits a destination with an empty name")` |
| US-5.3 | User edits a destination with an empty address line 1 | `frontend/tests/destinationList.test.js` | `it("User edits a destination with an empty address line 1")` |
| US-5.3 | User edits a destination with an empty city | `frontend/tests/destinationList.test.js` | `it("User edits a destination with an empty city")` |
| US-5.3 | User edits a destination with an empty state | `frontend/tests/destinationList.test.js` | `it("User edits a destination with an empty state")` |
| US-5.3 | User edits a destination with an empty zip | `frontend/tests/destinationList.test.js` | `it("User edits a destination with an empty zip")` |
| US-5.3 | User edits a destination with an existing name | `frontend/tests/destinationList.test.js` | `it("User edits a destination with an existing name")` |
| US-5.3 | User edits a destination with a name that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User edits a destination with a name that is too long")` |
| US-5.3 | User edits a destination with an address line 1 that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User edits a destination with an address line 1 that is too long")` |
| US-5.3 | User edits a destination with an address line 2 that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User edits a destination with an address line 2 that is too long")` |
| US-5.3 | User edits a destination with a city that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User edits a destination with a city that is too long")` |
| US-5.3 | User edits a destination with a state that is too long | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User edits a destination with a state that is too long")` |
| US-5.3 | User edits a destination with an invalid zip | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User edits a destination with an invalid zip")` |
| US-5.3 | User updates a destination with a non-numeric id | `backend/tests/destinations.test.js` | `it("User updates a destination with a non-numeric id")` |
| US-5.3 | User updates a destination that does not exist | `backend/tests/destinations.test.js` | `it("User updates a destination that does not exist")` |
| US-5.3 | Non-admin cannot edit a destination | `backend/tests/destinations.test.js` | `it("Non-admin cannot edit a destination")` |
| US-5.4 | User removes a destination | `backend/tests/destinations.test.js`; `frontend/tests/destinationList.test.js` | `it("User removes a destination")` |
| US-5.4 | User deletes a destination with a non-numeric id | `backend/tests/destinations.test.js` | `it("User deletes a destination with a non-numeric id")` |
| US-5.4 | User deletes a destination that does not exist | `backend/tests/destinations.test.js` | `it("User deletes a destination that does not exist")` |
| US-5.4 | Non-admin cannot remove a destination | `backend/tests/destinations.test.js` | `it("Non-admin cannot remove a destination")`|
| US-5.4 | Non-admin cannot remove a destination | `backend/tests/destinations.test.js` | `it("Non-admin cannot remove a destination")` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-destination-management.md on branch `feature-5-destination-management`.

Follow layer order in @feacdtures/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [ ] **Success Criteria (SC-00N)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

## Out of Scope

*   Register, sign in, session persistence, and logout ([Feature 1](feature-1-user-authentification.md))
*   Bulk `DELETE /destinationapi/destinations` (delete-all) and `GET /destinationapi/destinations/:id`
*   Per-user destination ownership (`userId` on `destinations`)
*   Profile management
