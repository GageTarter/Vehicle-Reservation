# Feature: Weekly Reservation Calendar

**Feature ID:** 11
**Branch pattern:** `feature/11-weekly-reservation-calendar`
**Status:** Ready
**Created:** 2026-11-06
**Input:** An admin views a weekly schedule of vehicle requests with status and assigned vehicle.
**Depends on:** [Feature 8 — Vehicle Reservation Requests](feature-8-vehicle-reservation-requests.md), [Feature 9 — Vehicle Assignment and Availability](feature-9-vehicle-assignment-and-availability.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-11.1: View this week's schedule
**As an** admin
**I want to** see a weekly calendar of reservations
**So that** I can see each request, its status, and its vehicle

**Priority:** P1
**Independent test:** GET calendar for a week returns overlapping reservations with status and vehicle
**Acceptance scenarios:** see ### US-11.1 under Acceptance Criteria

### US-11.2: Move to another week
**As an** admin
**I want to** go to the previous or next week
**So that** I can inspect other trip windows

**Priority:** P1
**Independent test:** Prev/next reloads the calendar for the adjacent week start
**Acceptance scenarios:** see ### US-11.2 under Acceptance Criteria

### US-11.3: Requestors cannot open the calendar
**As the** application
**I want** the calendar API and route limited to admins
**So that** requestors only see their own list

**Priority:** P1
**Independent test:** User GET calendar → `403`; user route → redirect away
**Acceptance scenarios:** see ### US-11.3 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: `GET /vehicles/reservations/calendar?weekStart=YYYY-MM-DD` MUST require `authenticate` and `requireAdmin`.
- **FR-002**: `weekStart` MUST be a Monday (`YYYY-MM-DD`). Invalid or non-Monday → `400` with `{ "message": "weekStart must be a Monday (YYYY-MM-DD)." }`. Missing `weekStart` → same `400`.
- **FR-003**: The week window is Monday 00:00:00.000 UTC through the following Monday 00:00:00.000 UTC (half-open). A reservation is included when `startAt < weekEnd` AND `endAt > weekStart`.
- **FR-004**: Each item MUST include reservation `id`, `partyName`, `requestorUserId`, `status`, `vehicleId`, `startAt`, `endAt`, `destinationId`.
- **FR-005**: Order MUST be `startAt` ASC, `id` ASC.
- **FR-006**: The **Weekly calendar** view MUST render seven weekday columns (Mon–Sun) and place each reservation on every day it overlaps.
- **FR-007**: Each calendar card MUST show status and vehicle id (or **"Unassigned"** when `vehicleId` is null).
- **FR-008**: Requestors MUST receive `403` on the calendar API and MUST NOT see the calendar in navigation.

---

## Assumptions

- Feature 10 email behavior does not appear on the calendar.
- Area filter is omitted (no Area Admin role). Admins see the whole fleet week.
- Week boundaries use UTC dates to match stored `startAt`/`endAt`.

## Edge Cases

- Reservation spanning two weeks appears in both week queries.
- Empty week → `200` `[]` and empty-state copy on the view.
- Unauthenticated → `401`.
- Sunday passed as `weekStart` → `400`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: An admin can open this week, see request/status/vehicle, and page to adjacent weeks.
- **SC-003**: A requestor cannot load calendar data.
- **SC-004**: `npm test` passes.

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Read** | Admin only; all reservations overlapping the week. |
| **Requestor** | No calendar access (`403`). |
| **Writes** | None in this feature. |

---

## Key Entities

- **Reservation week view**: read model over Feature 8/9 rows. No new entity.

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/vehicles/reservations/calendar?weekStart=2026-11-16` | Yes + admin | Reservations overlapping that week |

**Success (`200`):** JSON array of reservation objects (Feature 8 shape).

| Status | Used for |
|--------|----------|
| `200` | List (possibly empty) |
| `400` | Bad or missing `weekStart` |
| `401` | No token |
| `403` | Non-admin |

---

## Screen Requirements

### [View: Weekly calendar] — route name `calendar`

Admin only.

*   Heading: **Weekly calendar**
*   Caption line shows the week range from `weekStart`
*   Actions: **Previous week**, **Next week** (not `oc-cta`); default load is the Monday of the current UTC week
*   Seven columns labeled **Mon** … **Sun**
*   Cards: party or requestor id, status chip, vehicle id or **Unassigned**
*   **Empty state:** **"No reservations this week."**
*   **Loading** and `<v-alert type="error">` as in other views
*   MenuBar (existing) shows **Weekly calendar** only when `role` is `admin`

---

## Data Model Requirements

No schema changes.

---

## Acceptance Criteria (Gherkin)

### US-11.1 — View this week's schedule

#### Scenario: Admin loads a week with reservations
*   **Given** I am signed in as an admin
*   **And** a reservation starts Wednesday of the week beginning `2026-11-16`
*   **When** I request `GET /vehicles/reservations/calendar?weekStart=2026-11-16`
*   **Then** the API returns `200` including that reservation’s `id`, `status`, and `vehicleId`
*   **And** the **Weekly calendar** shows that reservation under **Wed**

#### Scenario: Empty week
*   **Given** I am signed in as an admin
*   **And** no reservation overlaps the week of `2026-11-16`
*   **When** I open **Weekly calendar** for that week
*   **Then** I see **"No reservations this week."**

#### Scenario: weekStart that is not Monday is rejected
*   **Given** I am signed in as an admin
*   **When** I request `GET /vehicles/reservations/calendar?weekStart=2026-11-17`
*   **Then** the API returns `400` with `{ "message": "weekStart must be a Monday (YYYY-MM-DD)." }`

---

### US-11.2 — Move to another week

#### Scenario: Admin opens the next week
*   **Given** I am signed in as an admin on **Weekly calendar** for `2026-11-16`
*   **When** I click **Next week**
*   **Then** the client requests `weekStart=2026-11-23`
*   **And** the caption shows that week

---

### US-11.3 — Requestors cannot open the calendar

#### Scenario: Requestor is forbidden from the calendar API
*   **Given** I am signed in as a user
*   **When** I request `GET /vehicles/reservations/calendar?weekStart=2026-11-16`
*   **Then** the API returns `403`

#### Scenario: Unauthenticated calendar request
*   **Given** I have no valid session token
*   **When** I request `GET /vehicles/reservations/calendar?weekStart=2026-11-16`
*   **Then** the API returns `401`

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-11.1 | Admin loads a week with reservations | `backend/tests/reservation-calendar.test.js`, `frontend/tests/Calendar.test.js` | `Admin loads a week with reservations` |
| US-11.1 | Empty week | `frontend/tests/Calendar.test.js` | `Empty week` |
| US-11.1 | weekStart that is not Monday is rejected | `backend/tests/reservation-calendar.test.js` | `weekStart that is not Monday is rejected` |
| US-11.2 | Admin opens the next week | `frontend/tests/Calendar.test.js` | `Admin opens the next week` |
| US-11.3 | Requestor is forbidden from the calendar API | `backend/tests/reservation-calendar.test.js` | `Requestor is forbidden from the calendar API` |
| US-11.3 | Unauthenticated calendar request | `backend/tests/reservation-calendar.test.js` | `Unauthenticated calendar request` |

---

## Agent implementation request

```text
Implement Feature 11 from @features/feature-11-weekly-reservation-calendar.md on branch `feature/11-weekly-reservation-calendar`.

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

*   Checkout / return / issues (Features 12–13)
*   Drag-and-drop rescheduling
*   Area-filtered calendar
*   Requestor-facing calendar
