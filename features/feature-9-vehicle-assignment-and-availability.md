# Feature: Vehicle Assignment and Availability

**Feature ID:** 9
**Branch pattern:** `feature/9-vehicle-assignment-and-availability`
**Status:** Ready
**Created:** 2026-11-06
**Input:** An admin assigns an available fleet vehicle to a request (`reserved`) or marks the request as waiting (`awaiting_vehicle`).
**Depends on:** [Feature 8 — Vehicle Reservation Requests](feature-8-vehicle-reservation-requests.md), [Feature 3 — Vehicle Management](feature-3-vehicle-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-9.1: Assign an available vehicle
**As an** admin
**I want to** assign a vehicle that is free for the trip window
**So that** the request becomes **reserved**

**Priority:** P1
**Independent test:** PUT assignment with a free vehicle sets `vehicleId` and `status` `reserved`
**Acceptance scenarios:** see ### US-9.1 under Acceptance Criteria

### US-9.2: Reject overlapping assignment
**As the** application
**I want to** refuse a vehicle that already has a `reserved` trip overlapping this start/end
**So that** two trips cannot hold the same vehicle at once

**Priority:** P1
**Independent test:** Overlapping `reserved` row for the same `vehicleId` → `409`
**Acceptance scenarios:** see ### US-9.2 under Acceptance Criteria

### US-9.3: Mark awaiting vehicle
**As an** admin
**I want to** mark a request as awaiting a vehicle when none is available
**So that** it appears on the need-vehicle queue

**Priority:** P1
**Independent test:** PUT awaiting sets `status` `awaiting_vehicle` and `vehicleId` null
**Acceptance scenarios:** see ### US-9.3 under Acceptance Criteria

### US-9.4: Need-vehicle queue
**As an** admin
**I want to** see requests that need a vehicle
**So that** I can service the queue

**Priority:** P1
**Independent test:** Filter `status=awaiting_vehicle` returns only those rows
**Acceptance scenarios:** see ### US-9.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Assignment endpoints MUST require `authenticate` and `requireAdmin`. Requestor → `403`. Unauthenticated → `401`.
- **FR-002**: Assigning a vehicle MUST set `vehicleId` to that id and `status` to `reserved` when the vehicle exists and is free for `[startAt, endAt)`.
- **FR-003**: Two intervals overlap when `existing.startAt < incoming.endAt` AND `existing.endAt > incoming.startAt`. Only other rows with the same `vehicleId` and `status` `reserved` count. The current row is excluded from the check.
- **FR-004**: Overlap MUST return `409` with `{ "message": "Vehicle is not available for this time." }` and MUST NOT change the row.
- **FR-005**: Unknown vehicle id → `404` with `{ "message": "Vehicle with id=<id> not found." }`.
- **FR-006**: Marking awaiting vehicle MUST set `status` to `awaiting_vehicle` and `vehicleId` to `null`.
- **FR-007**: `GET /vehicles/reservations?status=awaiting_vehicle` MUST be admin-only and MUST return only matching rows, `startAt` ASC.
- **FR-008**: Requestors MUST NOT call assignment endpoints. Their list UI MUST remain read-only for status and vehicle.
- **FR-009**: Assignment MUST NOT send email (Feature 10). It MAY change `status`; Feature 10 listens to those changes after it ships.
- **FR-010**: Re-assignment of a `reserved` or `awaiting_vehicle` row is allowed: a new free vehicle moves the row to `reserved`; awaiting clears the vehicle.

---

## Assumptions

- Feature 8 `reservations` table is on `dev`.
- Feature 3 `vehicles` rows are the fleet catalogue used for assignment. Availability is computed only from `reserved` reservations, not from Feature 3 ownership.
- Feature 7 is unused. Area-scoped assignment is out of scope (no Area Admin role in Feature 1).

## Edge Cases

- Assign while reservation id unknown → `404` reservation message from Feature 8 helper.
- Assign `vehicleId` that is not an integer → `400`.
- Adjacent trips: `endAt` of A equals `startAt` of B → **not** overlapping (half-open interval).
- Requestor GET with `?status=` → `200` with only their own rows matching that status; never other users' rows.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Admin can reserve a free vehicle and can mark awaiting vehicle.
- **SC-003**: Overlapping reserve of the same vehicle is rejected with `409`.
- **SC-004**: `npm test` passes.

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Admin write** | Only `role` `admin` may assign or mark awaiting. |
| **Requestor** | No assignment routes. Cross-user reservation GET still `404` per Feature 8. |
| **Queue** | Need-vehicle list is admin-only. |
| **Implementation** | Reuse `getAccessibleReservationOrNull`; add `requireAdmin` on assignment router. |

---

## Key Entities

- **Reservation**: gains `vehicleId` and status `reserved` or `awaiting_vehicle`.
- **Vehicle**: assigned resource; availability is the absence of overlapping `reserved` rows.

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `PUT` | `/vehicles/reservations/:id/assignment` | Yes + admin | Assign vehicle or mark awaiting |
| `GET` | `/vehicles/reservations?status=awaiting_vehicle` | Yes + admin | Need-vehicle queue |

**Assign body:**
```json
{ "vehicleId": 7 }
```

**Awaiting body:**
```json
{ "vehicleId": null }
```

Success (`200`): the Feature 8 reservation object with updated `status` and `vehicleId`.

| Status | Used for |
|--------|----------|
| `200` | Assignment or awaiting applied |
| `400` | `vehicleId` missing from body (must be present: integer or `null`) |
| `401` | No token |
| `403` | Authenticated non-admin |
| `404` | Reservation or vehicle not found |
| `409` | Vehicle overlap |

---

## Screen Requirements

### [View: Request servicing] — route name `requestServicing`

Admin only. Router sends non-admin to `home`.

*   Heading: **Need Vehicle**
*   Lists reservations with status **Awaiting vehicle**
*   Each row: requestor/party, destination, start, end
*   Primary row action **Assign vehicle** opens a dialog: vehicle select + **Reserve** (`oc-cta`) / **Cancel**
*   On overlap error, `<v-alert type="error">` shows **"Vehicle is not available for this time."**
*   From **My Requests** (admin), each non-reserved row also exposes **Assign vehicle** and **Mark awaiting vehicle**
*   Empty queue: **"No requests need a vehicle."**

---

## Data Model Requirements

No new tables. Same `reservations` columns as Feature 8.

This feature writes `status` values `reserved` and `awaiting_vehicle` and sets or clears `vehicleId`.

---

## Acceptance Criteria (Gherkin)

### US-9.1 — Assign an available vehicle

#### Scenario: Admin assigns a free vehicle
*   **Given** I am signed in as an admin
*   **And** a reservation exists with status `requested`
*   **And** a vehicle exists with no overlapping `reserved` trip
*   **When** I send `PUT /vehicles/reservations/:id/assignment` with that `vehicleId`
*   **Then** the API returns `200` with `status` `reserved` and that `vehicleId`

#### Scenario: Requestor cannot assign a vehicle
*   **Given** I am signed in as a user
*   **And** I own a reservation
*   **When** I send `PUT /vehicles/reservations/:id/assignment` with a `vehicleId`
*   **Then** the API returns `403`

---

### US-9.2 — Reject overlapping assignment

#### Scenario: Admin cannot double-book a reserved vehicle
*   **Given** I am signed in as an admin
*   **And** vehicle `7` is `reserved` for Monday 9:00–12:00
*   **And** another reservation is `requested` for Monday 11:00–13:00
*   **When** I assign vehicle `7` to the second reservation
*   **Then** the API returns `409` with `{ "message": "Vehicle is not available for this time." }`
*   **And** the second reservation remains `requested` with `vehicleId` null

#### Scenario: Back-to-back trips are allowed
*   **Given** I am signed in as an admin
*   **And** vehicle `7` is `reserved` until Monday 12:00
*   **And** another reservation starts Monday 12:00
*   **When** I assign vehicle `7` to the second reservation
*   **Then** the API returns `200` with `status` `reserved`

---

### US-9.3 — Mark awaiting vehicle

#### Scenario: Admin marks a request awaiting vehicle
*   **Given** I am signed in as an admin
*   **And** a reservation exists with status `requested`
*   **When** I send `PUT /vehicles/reservations/:id/assignment` with `"vehicleId": null`
*   **Then** the API returns `200` with `status` `awaiting_vehicle` and `vehicleId` `null`

---

### US-9.4 — Need-vehicle queue

#### Scenario: Admin lists requests that need a vehicle
*   **Given** I am signed in as an admin
*   **And** one reservation is `awaiting_vehicle` and another is `requested`
*   **When** I request `GET /vehicles/reservations?status=awaiting_vehicle`
*   **Then** the response contains only the `awaiting_vehicle` row

#### Scenario: Need Vehicle view empty state
*   **Given** I am signed in as an admin
*   **And** no reservation is `awaiting_vehicle`
*   **When** I open **Need Vehicle**
*   **Then** I see **"No requests need a vehicle."**

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-9.1 | Admin assigns a free vehicle | `backend/tests/reservation-assignment.test.js` | `Admin assigns a free vehicle` |
| US-9.1 | Requestor cannot assign a vehicle | `backend/tests/reservation-assignment.test.js` | `Requestor cannot assign a vehicle` |
| US-9.2 | Admin cannot double-book a reserved vehicle | `backend/tests/reservation-assignment.test.js` | `Admin cannot double-book a reserved vehicle` |
| US-9.2 | Back-to-back trips are allowed | `backend/tests/reservation-assignment.test.js` | `Back-to-back trips are allowed` |
| US-9.3 | Admin marks a request awaiting vehicle | `backend/tests/reservation-assignment.test.js` | `Admin marks a request awaiting vehicle` |
| US-9.4 | Admin lists requests that need a vehicle | `backend/tests/reservation-assignment.test.js` | `Admin lists requests that need a vehicle` |
| US-9.4 | Need Vehicle view empty state | `frontend/tests/RequestServicing.test.js` | `Need Vehicle view empty state` |

---

## Agent implementation request

```text
Implement Feature 9 from @features/feature-9-vehicle-assignment-and-availability.md on branch `feature/9-vehicle-assignment-and-availability`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/behavior.md`

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

*   Status-change and day-before emails (Feature 10)
*   Weekly calendar (Feature 11)
*   Check-in / checkout / `returned` (Feature 12)
*   Issue reporting (Feature 13)
*   Area-filtered queues

---

## Delivered to Feature 10

*   Status values `reserved` and `awaiting_vehicle`
*   Assignment as the first status-change producer Feature 10 will email on
