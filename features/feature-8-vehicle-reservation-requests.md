# Feature: Vehicle Reservation Requests

**Feature ID:** 8
**Branch pattern:** `feature/8-vehicle-reservation-requests`
**Status:** Ready
**Created:** 2026-11-06
**Input:** A signed-in requestor creates and tracks their own vehicle reservation requests for the OC fleet.
**Depends on:** [Feature 1 — Google Authentication](feature-1-google-auth.md), [Feature 2 — User Management](feature-2-user-management.md), [Feature 3 — Vehicle Management](feature-3-vehicle-management.md), [Feature 4 — Driver Management](feature-4-driver-management.md), [Feature 5 — Destination Management](feature-5-destination-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-8.1: Create a reservation request
**As a** signed-in requestor (`role` `user`)
**I want to** submit a vehicle reservation request with trip details and an approved driver
**So that** the fleet office can service my trip

**Priority:** P1
**Independent test:** Submit a valid request; API returns `201` with `status` `requested` and the row appears on My Requests
**Acceptance scenarios:** see ### US-8.1 under Acceptance Criteria

### US-8.2: View my requests
**As a** signed-in requestor
**I want to** see all of my reservation requests and their statuses
**So that** I know which trips are pending or assigned

**Priority:** P1
**Independent test:** My Requests lists only rows where `requestorUserId` is the signed-in user
**Acceptance scenarios:** see ### US-8.2 under Acceptance Criteria

### US-8.3: Edit a pending request
**As a** signed-in requestor
**I want to** update a request that is still `requested`
**So that** I can correct trip details before assignment

**Priority:** P1
**Independent test:** PUT while `status` is `requested` updates fields; PUT while `reserved` returns `400`
**Acceptance scenarios:** see ### US-8.3 under Acceptance Criteria

### US-8.4: Admin can list every request
**As an** admin
**I want to** list all reservation requests
**So that** later features can assign vehicles and manage status

**Priority:** P1
**Independent test:** `GET /vehicles/reservations` as admin returns requests from multiple users
**Acceptance scenarios:** see ### US-8.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: All reservation endpoints MUST require `authenticate`. Missing or invalid token → `401`.
- **FR-002**: A new request MUST set `requestorUserId` from `req.user.id` only. Ignore any `requestorUserId` or `status` in the body.
- **FR-003**: Create MUST set `status` to `requested` and `vehicleId` to `null`.
- **FR-004**: Required create/update fields: `driverId`, `destinationId`, `startAt`, `endAt`, `passengerCount`. Optional: `partyName`, `noteType`, `noteText`.
- **FR-005**: `driverId` MUST reference an existing driver whose status is approved (Feature 4). Unknown or unapproved driver → `400` with `{ "message": "Driver must be on the approved drivers list." }`.
- **FR-006**: `destinationId` MUST reference an existing destination (Feature 5). Unknown destination → `400` with `{ "message": "Destination is required." }`.
- **FR-007**: `endAt` MUST be strictly after `startAt`. Otherwise `400` with `{ "message": "End must be after start." }`.
- **FR-008**: `passengerCount` MUST be an integer ≥ 1. Otherwise `400` with `{ "message": "Number of people must be at least 1." }`.
- **FR-009**: `partyName`, `noteType`, and `noteText` MUST be trimmed; empty optional strings stored as `null`. `partyName` max 100 characters; `noteType` max 50; `noteText` max 2000.
- **FR-010**: Requestors (`role` `user`) MAY `GET` / `PUT` only their own rows. Cross-user access → `404` with `{ "message": "Reservation with id=<id> not found." }` (never `403`).
- **FR-011**: Admins (`role` `admin`) MAY `GET` any reservation. Admins MUST NOT create a request owned by another user through this feature (create still uses `req.user.id`).
- **FR-012**: Requestors MAY update a row only while `status` is `requested`. Any other status → `400` with `{ "message": "Only requested reservations can be updated." }`.
- **FR-013**: List order MUST be `startAt` ASC, then `id` ASC.
- **FR-014**: This feature MUST deliver My Requests UI for requestors and MUST NOT assign vehicles or send email.
- **FR-015**: `GET /vehicles/drivers` MUST return only drivers with `status` `approved`. `GET /vehicles/destinations` MUST return every destination. Both require `authenticate`. The request form uses these lists.

---

## Assumptions

- Feature 1 roles: `user` is the North **Requestor**; `admin` is the North **Admin**. Area Admin is not a separate role in this feature.
- Features 4 and 5 have no schema yet. This feature creates the minimum `drivers` (`id`, `name`, `status`) and `destinations` (`id`, `name`) rows it must validate. A driver is approved when `status` is `approved`. Features 4 and 5 extend these tables; they do not replace the reservation rules.
- Feature 3’s `vehicles` table is not on this branch. `vehicleId` is stored as a nullable integer with no foreign key until that table exists. Requestors do not choose a vehicle here.
- Dates and times are stored as UTC ISO-8601 datetimes. Requestors who “only use dates” still submit start/end datetimes (date-only UI may default time to `00:00` / `23:59` locally; the API always receives datetimes).

## Edge Cases

- Unauthenticated My Requests or API → redirect to login or `401`.
- Invalid `id` (`NaN`) → `400`.
- Whitespace-only `partyName` → stored `null`.
- `passengerCount` `0` or negative → `400`.
- `endAt` equal to `startAt` → `400`.
- Requestor PUT after admin has set `awaiting_vehicle` or `reserved` (Feature 9) → `400`.
- Body includes `status` `reserved` on create → saved status is still `requested`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A requestor can create a request, see it on My Requests with status **Requested**, and edit it until it leaves `requested`.
- **SC-003**: A requestor never sees another user’s requests via API or UI.
- **SC-004**: `npm test` passes for reservation API and My Requests view.

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Create scope** | `requestorUserId` always `req.user.id`. |
| **Read scope (user)** | `GET /vehicles/reservations` returns only `requestorUserId = req.user.id`. |
| **Read scope (admin)** | Same endpoint returns all rows. |
| **Write scope (user)** | `PUT` succeeds only when `id` matches and `requestorUserId = req.user.id` and `status = requested`. |
| **Cross-user access** | Other user’s id → `404`, not `403`. |
| **UI scope** | My Requests renders only the array returned for the signed-in user. |
| **Implementation** | Shared helper `getAccessibleReservationOrNull(req, id)` in `backend/app/authorization/`. |

---

## Key Entities

- **Reservation**: one trip request owned by one requestor; starts unassigned.
- **User**: requestor (`user`) or admin (`admin`).
- **Driver**: approved driver named on the request (Feature 4).
- **Destination**: trip destination used later for mileage estimate (Feature 5); this feature only stores the FK.
- **Vehicle**: not assigned here (Feature 9).

---

## API Requirements

Mount prefix is `/vehicles` (Features 1–2). Flat JSON. No `{ success, data }` envelope.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/vehicles/reservations` | Yes | List reservations (own rows, or all if admin) |
| `POST` | `/vehicles/reservations` | Yes | Create a request (`201`) |
| `GET` | `/vehicles/reservations/:id` | Yes | Fetch one accessible reservation |
| `PUT` | `/vehicles/reservations/:id` | Yes | Update a `requested` row owned by the caller |
| `GET` | `/vehicles/drivers` | Yes | Approved drivers for the request form |
| `GET` | `/vehicles/destinations` | Yes | Destinations for the request form |

**Create / update body:**
```json
{
  "partyName": "Women's Soccer",
  "driverId": 4,
  "destinationId": 2,
  "startAt": "2026-11-20T14:00:00.000Z",
  "endAt": "2026-11-22T18:00:00.000Z",
  "passengerCount": 12,
  "noteType": "general",
  "noteText": "Need a 15-passenger van"
}
```

**Success object** (`200` / `201`):
```json
{
  "id": 1,
  "requestorUserId": 42,
  "partyName": "Women's Soccer",
  "driverId": 4,
  "destinationId": 2,
  "startAt": "2026-11-20T14:00:00.000Z",
  "endAt": "2026-11-22T18:00:00.000Z",
  "passengerCount": 12,
  "noteType": "general",
  "noteText": "Need a 15-passenger van",
  "status": "requested",
  "vehicleId": null,
  "createdAt": "2026-11-06T15:00:00.000Z",
  "updatedAt": "2026-11-06T15:00:00.000Z"
}
```

List success (`200`): JSON array of those objects.

| Status | Used for |
|--------|----------|
| `200` | GET / PUT succeeded |
| `201` | POST created |
| `400` | Validation (driver, destination, dates, passenger count, not `requested`) |
| `401` | Missing or invalid session |
| `404` | Missing or not accessible reservation |

Unauthenticated message matches Feature 1: `{ "message": "Unauthorized! No token provided." }` when the header is missing.

---

## Screen Requirements

### [View: My Requests] — route name `requests`

Protected. Requestor home for this feature.

*   Heading: **My Requests**
*   Primary action: **+ New Request** (`class="oc-cta"`) opens a `<v-dialog>`
*   Dialog fields: Party or team name (optional), Driver (select of approved drivers), Destination (select), Start, End, Number of people, Note type, Note text. Actions: **Submit** (`oc-cta`) / **Cancel**
*   Table/list rows: party or requestor name, destination, start, end, status chip **Requested** (and later statuses as read-only text)
*   Row action **Edit request** (`aria-label`) — only when status is Requested; opens the same dialog pre-filled; **Save** / **Cancel**
*   **Empty state:** **"No requests yet. Create your first request."**
*   **Loading:** skeleton or progress while fetching
*   **Error:** `<v-alert type="error">` for API failures
*   Inline validation: **"Number of people must be at least 1."**, **"End must be after start."**, **"Driver must be on the approved drivers list."** — block submit when empty required fields; message **"Driver is required."** / **"Destination is required."**

Admins may open the same list route and see every request (read-only in this feature; assignment UI is Feature 9).

---

## Data Model Requirements

### `reservations` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `requestorUserId` | INTEGER FK | Required; `users.id`; set from session |
| `partyName` | STRING(100) | Nullable |
| `driverId` | INTEGER FK | Required; `drivers.id` |
| `destinationId` | INTEGER FK | Required; `destinations.id` |
| `startAt` | DATE | Required; UTC datetime |
| `endAt` | DATE | Required; UTC datetime; must be after `startAt` |
| `passengerCount` | INTEGER | Required; ≥ 1 |
| `noteType` | STRING(50) | Nullable |
| `noteText` | STRING(2000) | Nullable |
| `status` | STRING(32) | Required; default `requested` |
| `vehicleId` | INTEGER | Nullable; no foreign key until Feature 3’s `vehicles` table exists |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

Allowed `status` values this feature writes: `requested` only. Later features may persist `awaiting_vehicle` and `reserved` on the same column.

### `drivers` table (minimum until Feature 4)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required |
| `status` | STRING(32) | Required; `approved` may be selected |

### `destinations` table (minimum until Feature 5)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required |

### Associations (in `models/index.js`)

*   `User hasMany Reservation` (`foreignKey` `requestorUserId`)
*   `Reservation belongsTo User` as requestor
*   `Reservation belongsTo Driver`
*   `Reservation belongsTo Destination`

---

## Acceptance Criteria (Gherkin)

### US-8.1 — Create a reservation request

#### Scenario: Requestor creates a reservation request
*   **Given** I am signed in as a user
*   **And** an approved driver and a destination exist
*   **When** I click **+ New Request**
*   **And** I enter a valid driver, destination, start, end, and number of people `12`
*   **And** I confirm the dialog
*   **Then** the API returns `201` with `status` `requested` and `vehicleId` `null`
*   **And** the returned `requestorUserId` matches my user id
*   **And** the request appears on **My Requests**
*   **And** the dialog closes

#### Scenario: Requestor omits the driver
*   **Given** I am signed in as a user
*   **When** I open **+ New Request**
*   **And** I leave Driver empty
*   **And** I attempt to submit
*   **Then** inline validation blocks the request
*   **And** I see **"Driver is required."**
*   **And** no API request is sent

#### Scenario: Client cannot set status or owner on create
*   **Given** I am signed in as a user
*   **When** I send `POST /vehicles/reservations` with body including `"status": "reserved"` and `"requestorUserId": 999`
*   **Then** the API returns `201` with `status` `requested`
*   **And** `requestorUserId` is my id, not `999`

#### Scenario: Unapproved driver is rejected
*   **Given** I am signed in as a user
*   **And** a driver exists whose status is not `approved`
*   **When** I send `POST /vehicles/reservations` with that `driverId`
*   **Then** the API returns `400` with `{ "message": "Driver must be on the approved drivers list." }`

#### Scenario: Approved drivers and destinations are listed
*   **Given** I am signed in as a user
*   **And** one driver is `approved` and another is not
*   **And** a destination exists
*   **When** I request `GET /vehicles/drivers` and `GET /vehicles/destinations`
*   **Then** the driver list contains only the approved driver
*   **And** the destination list contains that destination

#### Scenario: End is not after start
*   **Given** I am signed in as a user
*   **When** I submit a request whose `endAt` is not after `startAt`
*   **Then** the API returns `400` with `{ "message": "End must be after start." }`

---

### US-8.2 — View my requests

#### Scenario: My Requests loads owned rows
*   **Given** I am signed in as a user
*   **And** I own two reservations
*   **When** I navigate to **My Requests**
*   **Then** both of my reservations appear
*   **And** each row shows destination, start, end, and status

#### Scenario: User has no requests
*   **Given** I am signed in as a user
*   **And** I have no reservations
*   **When** I navigate to **My Requests**
*   **Then** I see **"No requests yet. Create your first request."**

#### Scenario: Requestor cannot see another user's requests
*   **Given** user B owns a reservation
*   **And** I am signed in as user A
*   **When** I request `GET /vehicles/reservations`
*   **Then** user B's reservation is not in the response
*   **And** **My Requests** does not show user B's reservation

#### Scenario: Unauthenticated API request to reservations
*   **Given** I have no valid session token
*   **When** I request `GET /vehicles/reservations`
*   **Then** the API returns `401`

---

### US-8.3 — Edit a pending request

#### Scenario: Requestor updates a requested reservation
*   **Given** I am signed in as a user
*   **And** I own a reservation with status `requested`
*   **When** I change `passengerCount` to `8` and save
*   **Then** the API returns `200` with `passengerCount` `8`
*   **And** **My Requests** shows the updated value

#### Scenario: Requestor cannot update another user's reservation
*   **Given** I am signed in as user A
*   **And** a reservation exists that belongs to user B
*   **When** I send `PUT /vehicles/reservations/:id` with user B's id
*   **Then** the API returns `404` with `{ "message": "Reservation with id=<id> not found." }`
*   **And** user B's row is unchanged

#### Scenario: Requestor cannot update after status leaves requested
*   **Given** I am signed in as a user
*   **And** I own a reservation whose `status` is `reserved`
*   **When** I send `PUT /vehicles/reservations/:id` with a new `passengerCount`
*   **Then** the API returns `400` with `{ "message": "Only requested reservations can be updated." }`

---

### US-8.4 — Admin can list every request

#### Scenario: Admin lists all reservations
*   **Given** I am signed in as an admin
*   **And** user A and user B each own a reservation
*   **When** I request `GET /vehicles/reservations`
*   **Then** the response includes both reservations

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-8.1 | Requestor creates a reservation request | `backend/tests/reservations.test.js`, `frontend/tests/Requests.test.js` | `Requestor creates a reservation request` |
| US-8.1 | Requestor omits the driver | `frontend/tests/Requests.test.js` | `Requestor omits the driver` |
| US-8.1 | Client cannot set status or owner on create | `backend/tests/reservations.test.js` | `Client cannot set status or owner on create` |
| US-8.1 | Unapproved driver is rejected | `backend/tests/reservations.test.js` | `Unapproved driver is rejected` |
| US-8.1 | Approved drivers and destinations are listed | `backend/tests/reservations.test.js` | `Approved drivers and destinations are listed` |
| US-8.1 | End is not after start | `backend/tests/reservations.test.js` | `End is not after start` |
| US-8.2 | My Requests loads owned rows | `backend/tests/reservations.test.js`, `frontend/tests/Requests.test.js` | `My Requests loads owned rows` |
| US-8.2 | User has no requests | `frontend/tests/Requests.test.js` | `User has no requests` |
| US-8.2 | Requestor cannot see another user's requests | `backend/tests/reservations.test.js` | `Requestor cannot see another user's requests` |
| US-8.2 | Unauthenticated API request to reservations | `backend/tests/reservations.test.js` | `Unauthenticated API request to reservations` |
| US-8.3 | Requestor updates a requested reservation | `backend/tests/reservations.test.js`, `frontend/tests/Requests.test.js` | `Requestor updates a requested reservation` |
| US-8.3 | Requestor cannot update another user's reservation | `backend/tests/reservations.test.js` | `Requestor cannot update another user's reservation` |
| US-8.3 | Requestor cannot update after status leaves requested | `backend/tests/reservations.test.js` | `Requestor cannot update after status leaves requested` |
| US-8.4 | Admin lists all reservations | `backend/tests/reservations.test.js` | `Admin lists all reservations` |

---

## Agent implementation request

```text
Implement Feature 8 from @features/feature-8-vehicle-reservation-requests.md on branch `feature/8-vehicle-reservation-requests`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [ ] **Success Criteria (SC-00N)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

*   Vehicle assignment and availability overlap checks (Feature 9)
*   Status-change email and day-before pickup email (Feature 10)
*   Weekly calendar (Feature 11)
*   Checkout, key return, and `returned` status (Feature 12)
*   Return issues: Low Gas, Dirty, Maintenance (Feature 13)
*   Area Admin role and area-scoped request queues (Feature 6 / later)
*   Mileage estimate from destination

---

## Delivered to Feature 9

*   `reservations` table with `status` `requested` and `vehicleId` null
*   Requestor My Requests UI and admin list API
*   Shared `getAccessibleReservationOrNull`
