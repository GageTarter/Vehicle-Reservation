# Feature: Driver Management

**Feature ID:** 4
**Branch pattern:** `features/4-driver-management`
**Status:** Draft
**Created:** 2026-11-04
**Input:** drivers created and managed by the users with admin privelages
**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)

---

## User Stories

### US-4.1: Add a driver
**As a** admin
**I want to** add a driver with a required name, last name, driver ID, and license information
**So that** I can use it during fleet registration
**Priority:** P1
**Independent test:** Submit the Add Driver dialogue and see the driver in the drivers table
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Browse the drivers list
**As a** signed-in user
**I want to** see every driver with its name, last name, ID, and license information
**So that** I can see what drivers are already in the system
**Priority:** P1
**Independent test:** Open the drivers page and confirm each row shows name, last name, ID, license state, license expiration, approved date, and status
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: Correct a driver's data
**As a** admin
**I want to** edit a driver's name, driver ID, license state, or license expiration, approved date, or status
**So that** the driver entries contain updated data
**Priority:** P2
**Independent test:** Edit one driver's name, last name, ID, license state, license expirtation, approved date, or status and confirm the table shows the new value
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Remove a driver
**As a** admin
**I want to** remove a driver that is no longer provided
**So that** the old drivers are not listed
**Priority:** P3
**Independent test:** Delete an unused driver and confirm it leaves the drivers table
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** An admin must fill `name`, `lastName`, `driverID`, `licenseState`, `licenseExp`, `approvedDate`, and `status`. No fields are optional.
-- **FR-002:** Created drivers are shared. Only signed-in admin users can view every driver. No driver belongs to a specific user. A signed-in non-admin MUST receive `403` on `GET /driverapi/drivers`.
-- **FR-003:** Only an admin can view, create, edit, or delete a driver. 
-- **FR-004:** On edit, `name`, `lastName`, `driverID`, `licenseState`, `licenseExp`, `approvedDate`, and `status` are required. No fields are optional.
-- **FR-005:** Edited information must be updated in the affected driver when a user with admin privelages makes a change.
-- **FR-006:** driver must be completely erased when the delete option is selected by the user with admin privelages.
-- **FR-007:** Created drivers must be listed in alphabetical order according to last name.

---

## Assumptions

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.

## Edge Cases
- Empty or whitespace-only `name`, `lastName`, `licenseState`, or `status` → `400`.
- `name`, `lastName`, `licenseState`, or `status` longer than 100 characters → `400`.
- Empty or non-integer `driverID` → `400`.
- `licenseExp` or `approvedDate` that is not a valid date → `400`.
- Non-numeric `:id` → `400`.

## Success Criteria
- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Every signed-in user can view every driver on one screen. An admin can create, edit, and delete drivers on that screen.
- **SC-003**: `npm test` passes for driver API and dashboard drivers-view behavior.

## Data Ownership & Isolation

drivers are a shared catalogue. A driver has no owner and no `userId`. Every signed-in user sees the same rows (**FR-002**). Only an admin can create, edit, or delete (**FR-003**).

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /driverapi/drivers` returns every driver, ordered by `name` ascending (**FR-007**). Do not filter by `req.user.id` |
| **Write scope** | `PUT` / `DELETE /driverapi/drivers/:id` update or erase the row with that primary key. Missing id → `404`. Caller must be an admin |
| **Create scope** | `POST /driverapi/drivers` inserts a shared row. Do not set `userId` from the session or the body. Caller must be an admin |
| **Non-admin write** | A signed-in user who is not an admin → `403` on `POST`, `PUT`, and `DELETE` |
| **UI scope** | `driverList.vue` shows the full list from the API. Show **+ New driver**, **Edit driver**, and **Delete driver** only when the signed-in user is an admin |
| **Implementation** | Protect all four routes with `authenticateRoute`. Protect `POST`, `PUT`, and `DELETE` with `requireAdmin`. Do not scope queries by `req.user.id` |

Unauthenticated callers → `401`.

## Key Entities

-- **driver** shared catalogue entry. It has no owner.

## API Requirements

Mount prefix is `/driverapi` (existing `server.js` + `driverServices.js`). Paths below match `backend/app/routes/driver.routes.js`. All four endpoints require `Authorization: Bearer <token>`.

JSON property `driverID` matches the running app, the Data Model column `driverID`, and Gherkin.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/driverapi/drivers` | Yes | List every driver, alphabetical by `name` (**FR-002**, **FR-007**, US-4.2) |
| `POST` | `/driverapi/drivers` | Admin | Create a driver (**FR-001**, **FR-003**, US-4.1) |
| `PUT` | `/driverapi/drivers/:id` | Admin | Replace `name`, `lastName`, `driverID`, `licenseState`, `licenseExp`, `approvedDate`, and `status` of an existing driver (**FR-004**, **FR-005**, US-4.3) |
| `DELETE` | `/driverapi/drivers/:id` | Admin | Erase an existing driver (**FR-003**, **FR-006**, US-4.4) |

`:id` is the numeric primary key. Non-numeric 
`:id` → `400` (Edge Cases). `driverID` is the separate string field (example `CMSC-1113-01`).

This feature does **not** add `GET /driverapi/drivers/:id` or `DELETE /driverapi/drivers` (delete-all). Those exist in the current backend but are not authorized by these FRs/Gherkin.

**Create request body:** `name`, `lastName`, `driverID`, `licenseState`, `licenseExp`, `approvedDate`, and `status` are required. None may be omitted.
```json
{"name": "John", "lastName": "Smith", "driverID": 0, "licenseState": "Oklahoma", "licenseExp": "2027-9-23", "approvedDate": "2004-9-23", "status": "Approved"}
```
**Create success** (`201`):
```json
{"name": "John", "lastName": "Smith", "driverID": 0, "licenseState": "Oklahoma", "licenseExp": "2027-9-23", "approvedDate": "2004-9-23", "status": "Approved"}
```

**Create request body:** `name`, `lastName`, `driverID`, `licenseState`, `licenseExp`, `approvedDate`, and `status` are required. None may be omitted.

**Update success** (`200`) — same body the running app returns today:
```json
{ "message": "driver was updated successfully." }
```

**Delete success:** `200` or `204` (US-4.4). No requirement to return a message body.

**List success** (`200`): array of every driver, sorted by `name` descending. Empty catalogue → `[]`.

**Error response:** `{ "message": "Human-readable explanation." }`  
**Quoted validation (AC):**
- `name` longer than 100 characters → `400` `{ "message": "driver name must be 100 characters or fewer." }`
- `lastName longer than 100 characters → `400` `{ "message": "driver last name must be 100 characters or fewer." }`
- `licenseState` longer than 100 characters → `400` `{ "message": "driver license state must be 100 characters or fewer." }`
- `status` longer than 100 characters → `400` `{ "message": "driver status must be 100 characters or fewer." }`
- Empty or non-integer `driverID` → `400` `{ "message": "driverID must be an integer." }`
- `licenseExp` is not a valid date → `400` `{ "message": "driver license expiration must be a valid date." }`
- `approvedDate` is not a valid date → `400` `{ "message": "driver approved date must be a valid date." }`
- Non-numeric `:id` → `400` `{ "message": "driver id must be a number." }`
- Missing driver id → `404` `{ "message": "driver not found." }`
- Signed-in non-admin `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin privileges are required." }`

**Other errors:** empty or whitespace-only `name`, `lastName`, `licenseState`, or `status` → `400`; unauthenticated → `401`; signed-in non-admin `POST` / `PUT` / `DELETE` → `403`; missing id → `404`. Flat JSON — no `{ success, data }` envelope.

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc). Primary labeled CTAs use class `oc-cta`. Errors that Gherkin names use `<v-alert type="error">`.

### [View: drivers] — route name `drivers`

*   **Route:** `/drivers` → `frontend/src/views/driverList.vue` (existing `router.js`).
*   **Heading:** **drivers**
*   **Purpose:** One screen where every signed-in user browses every driver, and an admin creates, edits, and deletes drivers (**SC-002**).
*   **Primary action:** **+ New driver** (`oc-cta`) — opens the add dialog (US-4.1).
*   **Table columns:** Name, LastName, driverID, LicenseState, LicenseExpiration, ApprovedDate, Actions. Each row shows that driver's name, driver ID, and license expiration (US-4.2).

*   **Row actions (icon-only, `size="small"`):**
    *   **Edit driver** — `aria-label="Edit driver"`; opens the edit dialog (US-4.3).
    *   Delete icon on the row — `aria-label` **Delete driver**; opens the delete confirm dialog (US-4.4).
*   **Add dialog:** fields Name, Last Name, driver ID, License State, License Expiration, ApprovedDate, Status, Actions, and driver Area. All are required. Confirm submits create; **Close** dismisses without saving (existing dialog chrome). Dialog closes after a successful create.
*   **Edit dialog:** same eight fields, prefilled from the row. Name and driver ID are required. Clearing any fields stores `null` in those fields. Confirm submits update; **Close** dismisses. Dialog closes after a successful update. Click target and title use **Edit driver**.
*   **Delete dialog:** confirm then call `DELETE`; cancel/close leaves the row in place.
*   **Inline validation** (no API request) — exact AC copy:
*   **"driver name is required."**
*   **"driver last name is required."**
*   **"driver ID is required."**
*   **"driver license state is required."**
*   **"driver license expiration is required."**
*   **"driver approved date is required."**
*   **"driver area is required."**
*   **"driver status is required."**
*   **Empty state:** when no drivers exist, the table shows no driver rows (US-4.2 — "no drivers should be displayed").
*   **Loading:** table or page loading indicator while `getdrivers` is in flight.
*   **Error:** API failures and quoted `400` messages display in `<v-alert type="error">`.

driver ID is a required field the user fills (Gherkin example `CMSC-1113-01`).

**App chrome**
*   Existing `MenuBar` **drivers** button (`:to="{ name: 'drivers' }"`) is how US-4.2 "open the drivers menu" is reached. This feature does not add a new nav item.
*   MenuBar stays hidden on login (Feature 1). drivers navigation stays on Feature 2.

## Data Model Requirements

### `drivers` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | PK, auto-increment |
| `name` | STRING(100) | Required. At most 100 characters. Stored and displayed as typed |
| `lastName` | STRING(100) | Required. At most 100 characters. Stored and displayed as typed |
| `driverID` | INTEGER | Required. Must be an integer |
| `licenseState` | STRING(100) | Required. At most 100 characters. Stored and displayed as typed |
| `licenseExp` | DATE | Required. Must be a valid date |
| `approvedDate` | DATE | Required. Must be a valid date |
| `status` | STRING(100) | Required. At most 100 characters. Stored and displayed as typed |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

This feature does not associate **driver** with **User**. Drivers have no owner and no `userId` column.

## Acceptance Criteria (Gherkin)

### US-4.1 — Add a catalogue driver
#### Scenario: User creates a new driver
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **+ New driver**
*   **And** I enter driver name `Judah`
*   **And** I enter driver last name `Campbell`
*   **And** I enter driver ID `0`
*   **And** I enter license state `Oklahoma`
*   **And** I enter license expiration `2028-01-01`
*   **And** I enter approved date `2004-09-23`
*   **And** I enter status `Approved`
*   **And** I confirm the dialog
*   **Then** the API returns `201` with a driver object containing `id`, `name`, `lastName`, `driverID`, `licenseState`, `licenseExp`, `approvedDate`, and `status`.
*   **And** `Campbell, Judah` appears in the drivers view
*   **And** the add-driver dialog closes

#### Scenario: User creates a driver with an empty name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver name is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an empty last name
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the last name field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver last name is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an empty driver ID
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the driverID field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver ID is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an empty license state
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the license state field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver license state is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an empty license expiration
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the license expiration field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver license expiration is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an empty approved date
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the approved date field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver approved date is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an empty area
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the area field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver area is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an empty status
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I leave the status field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver status is required."**
*   **And** no API request is sent

#### Scenario: User creates a driver with an existing driver id
*   **Given** I am signed in as an admin on the dashboard
*   **When** I open the new driver dialog
*   **And** I fill the driver id with the id of an existing driver
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"driver id is in use. Enter a different driver id."**
*   **And** no API request is sent

#### Scenario: User creates a driver with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver name must be 100 characters or fewer." }`
#### Scenario: User creates a driver with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a last name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver last name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver last name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a license state that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver license state longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver license state must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a status that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver status longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver status must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a driver ID that is not an integer
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver ID that is not an integer
*   **Then** the API returns `400` with `{ "message": "driverID must be an integer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a license expiration that is not a valid date
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a license expiration that is not a valid date
*   **Then** the API returns `400` with `{ "message": "driver license expiration must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with an approved date that is not a valid date
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit an approved date that is not a valid date
*   **Then** the API returns `400` with `{ "message": "driver approved date must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: Non-admin cannot create a driver
*   **Given** I am signed in as a non-admin
*   **When** I send `POST /driverapi/drivers` with a name and driver ID
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the driver is not created

---

### US-4.2 — Browse the driver List
#### Scenario: User views existing drivers
*   **Given** I am signed in on the dashboard
*   **When** I open the drivers menu
*   **Then** existing drivers are displayed in alphabetical order of last name

#### Scenario: There are no existing drivers
*   **Given** I am signed in on the dashboard
*   **When** I open the drivers menu
*   **Then** no drivers should be displayed

### US-4.3 — Correct a driver's name, last name, driver ID, license state, license expiration, approved date, or status
#### Scenario: User edits a driver's information
*   **Given** I am signed in as an admin on the dashboard
*   **When** I click **Edit driver** on an existing driver
*   **And** I change any of the original values
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "driver was updated successfully." }`
*   **And** the driver is visible with updated information in the drivers view
*   **And** the edit-driver dialog closes

#### Scenario: User creates a driver with a name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a last name that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver last name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver last name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a license state that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver license state longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver license state must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a status that is too long
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a driver status longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "driver status must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with a non-numeric driver ID
*   **Given** I am signed in as an admin
*   **When** I send `PUT /driverapi/drivers/abc`
*   **Then** the API returns `400` with `{ "message": "driver id must be a number." }`
*   **And** no driver is changed

#### Scenario: User creates a driver with a license expiration that is not a valid date
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit a license expiration that is not a valid date
*   **Then** the API returns `400` with `{ "message": "driver license expiration must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User creates a driver with an approved date that is not a valid date
*   **Given** I am signed in as an admin on the dashboard
*   **When** I submit an approved date that is not a valid date
*   **Then** the API returns `400` with `{ "message": "driver approved date must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`

#### Scenario: User updates a driver that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `PUT /driverapi/drivers/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "driver not found." }`
*   **And** no driver is changed

#### Scenario: Non-admin cannot edit a driver
*   **Given** I am signed in as a non-admin
*   **And** a driver exists
*   **When** I send `PUT /driverapi/drivers/:id` for that driver
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** the driver is unchanged

### US-4.4 Remove a driver
#### Scenario: User removes a driver
*   **Given** I am signed in as an admin
*   **And** I have access to driver `Judah Campbell`
*   **When** I click the delete icon on the `Judah Campbell` row
*   **And** I confirm the delete dialog
*   **Then** the API returns `200` or `204`
*   **And** the driver is removed from the drivers view

#### Scenario: User deletes a driver with a non-numeric id
*   **Given** I am signed in as an admin
*   **When** I send `DELETE /driverapi/drivers/abc`
*   **Then** the API returns `400` with `{ "message": "driver id must be a number." }`
*   **And** no driver is removed

#### Scenario: User deletes a driver that does not exist
*   **Given** I am signed in as an admin
*   **When** I send `DELETE /driverapi/drivers/99999` for an id that is not in the catalogue
*   **Then** the API returns `404` with `{ "message": "driver not found." }`
*   **And** no driver is removed

#### Scenario: Non-admin cannot remove a driver
*   **Given** I am signed in as a non-admin
*   **And** a driver named `Programming I` exists
*   **When** I send `DELETE /driverapi/drivers/:id` for that driver
*   **Then** the API returns `403` with `{ "message": "Admin privileges are required." }`
*   **And** `Judah Campbell` is still listed

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-4.1 | User creates a new driver | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a new driver")` |
| US-4.1 | User creates a driver with an empty name | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty name")` |
| US-4.1 | User creates a driver with an empty last name | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty last name")` |
| US-4.1 | User creates a driver with an empty driver ID | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty driver ID")` |
| US-4.1 | User creates a driver with an empty license state | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty license state")` |
| US-4.1 | User creates a driver with an empty license expiration | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty license expiration")` |
| US-4.1 | User creates a driver with an empty approved date | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty approved date")` |
| US-4.1 | User creates a driver with an empty area | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty area")` |
| US-4.1 | User creates a driver with an empty status | `frontend/tests/driverList.test.js` | `it("User creates a driver with an empty status")` |
| US-4.1 | User creates a driver with an existing driver id | `frontend/tests/driverList.test.js` | `it("User creates a driver with an existing driver id")` |
| US-4.1 | User creates a driver with a name that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a name that is too long")` |
| US-4.1 | User creates a driver with a last name that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a last name that is too long")` |
| US-4.1 | User creates a driver with a license state that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a license state that is too long")` |
| US-4.1 | User creates a driver with a status that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a status that is too long")` |
| US-4.1 | User creates a driver with a driver ID that is not an integer | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a driver ID that is not an integer")` |
| US-4.1 | User creates a driver with a license expiration that is not a valid date | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a license expiration that is not a valid date")` |
| US-4.1 | User creates a driver with an approved date that is not a valid date | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with an approved date that is not a valid date")` |
| US-4.1 | Non-admin cannot create a driver | `backend/tests/drivers.test.js` | `it("Non-admin cannot create a driver")` |
| US-4.2 | User views existing drivers | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User views existing drivers")` |
| US-4.2 | There are no existing drivers | `frontend/tests/driverList.test.js` | `it("There are no existing drivers")` |
| US-4.3 | User edits a driver's information | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User edits a driver's information")` |
| US-4.3 | User creates a driver with a name that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a name that is too long")` |
| US-4.3 | User creates a driver with a last name that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a last name that is too long")` |
| US-4.3 | User creates a driver with a license state that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a license state that is too long")` |
| US-4.3 | User creates a driver with a status that is too long | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a status that is too long")` |
| US-4.3 | User creates a driver with a non-numeric driver ID | `backend/tests/drivers.test.js` | `it("User creates a driver with a non-numeric driver ID")` |
| US-4.3 | User creates a driver with a license expiration that is not a valid date | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with a license expiration that is not a valid date")` |
| US-4.3 | User creates a driver with an approved date that is not a valid date | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User creates a driver with an approved date that is not a valid date")` |
| US-4.3 | User updates a driver that does not exist | `backend/tests/drivers.test.js` | `it("User updates a driver that does not exist")` |
| US-4.3 | Non-admin cannot edit a driver | `backend/tests/drivers.test.js` | `it("Non-admin cannot edit a driver")` |
| US-4.4 | User removes a driver | `backend/tests/drivers.test.js`; `frontend/tests/driverList.test.js` | `it("User removes a driver")` |
| US-4.4 | User deletes a driver with a non-numeric id | `backend/tests/drivers.test.js` | `it("User deletes a driver with a non-numeric id")` |
| US-4.4 | User deletes a driver that does not exist | `backend/tests/drivers.test.js` | `it("User deletes a driver that does not exist")` |
| US-4.4 | Non-admin cannot remove a driver | `backend/tests/drivers.test.js` | `it("Non-admin cannot remove a driver")` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-driver-management.md on branch `feature-4-driver-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
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
*   Bulk `DELETE /driverapi/drivers` (delete-all) and `GET /driverapi/drivers/:id`
*   Per-user driver ownership (`userId` on `drivers`)
*   Profile management
