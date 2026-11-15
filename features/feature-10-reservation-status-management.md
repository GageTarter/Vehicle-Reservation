# Feature: Reservation Status Management

**Feature ID:** 10
**Branch pattern:** `feature/10-reservation-status-management`
**Status:** Ready
**Created:** 2026-11-06
**Input:** The requestor is emailed on every reservation status change, and receives area pickup instructions the day before the trip.
**Depends on:** [Feature 8 — Vehicle Reservation Requests](feature-8-vehicle-reservation-requests.md), [Feature 9 — Vehicle Assignment and Availability](feature-9-vehicle-assignment-and-availability.md), [Feature 6 — Area Management](feature-6-area-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-10.1: Email on status change
**As a** requestor
**I want** an email when my reservation status changes
**So that** I know whether the trip is requested, awaiting a vehicle, or reserved

**Priority:** P1
**Independent test:** Assigning a vehicle invokes the mailer once to the requestor’s email with the new status
**Acceptance scenarios:** see ### US-10.1 under Acceptance Criteria

### US-10.2: Day-before pickup instructions
**As a** requestor
**I want** pickup instructions the day before my trip
**So that** I know how to get the vehicle, keys, and parking

**Priority:** P1
**Independent test:** Running pre-trip notices the day before a `reserved` trip sends one instruction email
**Acceptance scenarios:** see ### US-10.2 under Acceptance Criteria

### US-10.3: Do not email when status is unchanged
**As the** application
**I want to** skip mail when an update does not change `status`
**So that** requestors are not spammed

**Priority:** P2
**Independent test:** Re-assigning the same status without a status change does not send a status email
**Acceptance scenarios:** see ### US-10.3 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Whenever a reservation `status` value changes, the app MUST send one email to the requestor’s `users.email`.
- **FR-002**: The status email subject MUST be **Reservation status updated** and the body MUST include the new status label (`requested`, `awaiting_vehicle`, or `reserved`), destination name, and start datetime.
- **FR-003**: Mail MUST go through a single `backend/app/services/mailer.js` module (send function). Tests MUST stub this module. Do not add an observability platform.
- **FR-004**: Create (Feature 8) sets `requested` — that initial insert MUST send the status email once (`requested`).
- **FR-005**: Feature 9 assignment and awaiting MUST send the status email after a successful status change.
- **FR-006**: `POST /vehicles/reservations/pre-trip-notices` MUST require `authenticate` and `requireAdmin`. It sends pickup-instruction emails for each `reserved` reservation whose UTC calendar date of `startAt` is **tomorrow** relative to a `now` timestamp (default `Date.now()`; tests MAY pass `now` in the JSON body).
- **FR-007**: A reservation MUST receive at most one pre-trip email. Persist `preTripEmailSentAt` when sent; skip rows where it is already set.
- **FR-008**: Pre-trip email subject MUST be **Vehicle pickup instructions**. Body MUST include vehicle identifier (when `vehicleId` is set), parking/keys/return reminder text, and the area notice email when the assigned vehicle has an area (Feature 6). If the vehicle has no area, use the default body: **"Pick up the vehicle and keys as instructed by your area office. Return the vehicle with fuel, cleaned, and keys turned in."**
- **FR-009**: This feature MUST NOT introduce `returned`, checkout, or issue fields.
- **FR-010**: Mailer failures MUST be logged with winston `error` and MUST NOT roll back the status change already committed.

---

## Assumptions

- SMTP transport may be a no-op in test and a console/winston sink in development. Production transport is configured by environment variables on the mailer module (`MAIL_FROM` required when actually sending).
- Feature 6 `areas.noticeEmail` is used when the assigned vehicle has `areaId`. If Feature 6 has not attached areas to vehicles yet, FR-008 default body applies.
- “Need to be checked in” work queue is Feature 12.

## Edge Cases

- Status change for a requestor with missing email → log error, no throw to the client.
- Pre-trip POST with no matching trips → `200` and `{ "sent": 0 }`.
- Non-admin pre-trip POST → `403`.
- `reserved` trip whose start is today or in two days → not selected.
- `awaiting_vehicle` trip the day before start → no pre-trip email (must be `reserved`).

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Status transitions from Features 8 and 9 result in exactly one status email per change.
- **SC-003**: Day-before job emails each reserved trip once.
- **SC-004**: `npm test` passes.

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Status email** | Always the reservation’s requestor, never another user. |
| **Pre-trip endpoint** | Admin only. |
| **No extra read APIs** | Requestors still only see their reservations. |

---

## Key Entities

- **Reservation**: adds `preTripEmailSentAt`.
- **Mailer**: outbound email port used by tests as a mock.

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/vehicles/reservations/pre-trip-notices` | Yes + admin | Send due pickup-instruction emails |

Existing Feature 8/9 routes gain mail side effects; their HTTP contracts stay the same.

**Pre-trip body (optional):**
```json
{ "now": "2026-11-19T12:00:00.000Z" }
```

**Success (`200`):**
```json
{ "sent": 1 }
```

---

## Screen Requirements

No new requestor screen. **Need Vehicle** (Feature 9) gains a **Send pickup notices** button (`oc-cta`) that calls the pre-trip endpoint and shows **"Sent <n> pickup notices."** in a `<v-snackbar>`.

Status chips on **My Requests** remain the Feature 8 display; no mailbox UI.

---

## Data Model Requirements

### `reservations` (delta)

| Field | Type | Rules |
|-------|------|-------|
| `preTripEmailSentAt` | DATE | Nullable; set when pre-trip email is sent |

---

## Acceptance Criteria (Gherkin)

### US-10.1 — Email on status change

#### Scenario: Creating a request emails requested status
*   **Given** I am signed in as a user with email `jane@example.com`
*   **When** I create a valid reservation
*   **Then** the mailer is called once
*   **And** the recipient is `jane@example.com`
*   **And** the subject is **Reservation status updated**
*   **And** the body includes `requested`

#### Scenario: Assigning a vehicle emails reserved status
*   **Given** a reservation is `requested`
*   **When** an admin assigns a free vehicle
*   **Then** the mailer is called with subject **Reservation status updated**
*   **And** the body includes `reserved`

#### Scenario: Marking awaiting vehicle emails that status
*   **Given** a reservation is `requested`
*   **When** an admin sets `vehicleId` to `null`
*   **Then** the mailer is called
*   **And** the body includes `awaiting_vehicle`

---

### US-10.2 — Day-before pickup instructions

#### Scenario: Admin sends pre-trip notices the day before a reserved trip
*   **Given** I am signed in as an admin
*   **And** a `reserved` reservation starts tomorrow relative to `now`
*   **And** `preTripEmailSentAt` is null
*   **When** I send `POST /vehicles/reservations/pre-trip-notices` with that `now`
*   **Then** the API returns `200` with `"sent": 1`
*   **And** the mailer subject is **Vehicle pickup instructions**
*   **And** `preTripEmailSentAt` is set

#### Scenario: Pre-trip notice is not sent twice
*   **Given** I am signed in as an admin
*   **And** a `reserved` reservation starts tomorrow and already has `preTripEmailSentAt` set
*   **When** I send `POST /vehicles/reservations/pre-trip-notices`
*   **Then** the API returns `200` with `"sent": 0`

#### Scenario: Requestor cannot send pre-trip notices
*   **Given** I am signed in as a user
*   **When** I send `POST /vehicles/reservations/pre-trip-notices`
*   **Then** the API returns `403`

---

### US-10.3 — Do not email when status is unchanged

#### Scenario: Re-assigning the same reserved vehicle does not send a second status email
*   **Given** a reservation is already `reserved` for vehicle `7`
*   **When** an admin assigns vehicle `7` again
*   **Then** `status` remains `reserved`
*   **And** no additional **Reservation status updated** email is sent

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-10.1 | Creating a request emails requested status | `backend/tests/reservation-mail.test.js` | `Creating a request emails requested status` |
| US-10.1 | Assigning a vehicle emails reserved status | `backend/tests/reservation-mail.test.js` | `Assigning a vehicle emails reserved status` |
| US-10.1 | Marking awaiting vehicle emails that status | `backend/tests/reservation-mail.test.js` | `Marking awaiting vehicle emails that status` |
| US-10.2 | Admin sends pre-trip notices the day before a reserved trip | `backend/tests/reservation-mail.test.js` | `Admin sends pre-trip notices the day before a reserved trip` |
| US-10.2 | Pre-trip notice is not sent twice | `backend/tests/reservation-mail.test.js` | `Pre-trip notice is not sent twice` |
| US-10.2 | Requestor cannot send pre-trip notices | `backend/tests/reservation-mail.test.js` | `Requestor cannot send pre-trip notices` |
| US-10.3 | Re-assigning the same reserved vehicle does not send a second status email | `backend/tests/reservation-mail.test.js` | `Re-assigning the same reserved vehicle does not send a second status email` |

---

## Agent implementation request

```text
Implement Feature 10 from @features/feature-10-reservation-status-management.md on branch `feature/10-reservation-status-management`.

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

*   Weekly calendar (Feature 11)
*   Checkout, keys, `returned`, need-check-in queue (Feature 12)
*   Low Gas / Dirty / Maintenance notices (Feature 13)
*   Full email-provider dashboard or retry platform (NFR logging remains Winston)

---

## Delivered to Feature 11

*   Status values and assigned vehicle on each reservation, which the calendar displays
*   Email side effects that calendar reads do not need to show
