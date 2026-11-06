# Feature: Vehicle Issue Reporting

**Feature ID:** 13  
**Branch pattern:** `feature/13-vehicle-issue-reporting`  
**Status:** Draft  
**Created:** 2026-10-27  
**Input:** OC Vehicle Scheduling System requirements  
**Depends on:** Feature 1 — User Authentication, Vehicle Reservation Management, Vehicle Assignment and Availability Management  
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-13.1: Report a vehicle issue
**As a** requestor  
**I want to** report an issue with a vehicle before, during, or after a trip  
**So that** the appropriate administrator knows about the problem  
**Priority:** P1  
**Independent test:** Report an issue for an assigned vehicle and confirm that the issue details are saved  
**Acceptance scenarios:** See US-13.1 under Acceptance Criteria

### US-13.2: View reported vehicle issues
**As an** area administrator  
**I want to** view issues reported for vehicles in my area  
**So that** I can review problems and determine what action is needed  
**Priority:** P1  
**Independent test:** Open the vehicle issue list and confirm that issues for the administrator's area are displayed  
**Acceptance scenarios:** See US-13.2 under Acceptance Criteria

### US-13.3: Update vehicle issue status
**As an** area administrator  
**I want to** update the status of a reported vehicle issue  
**So that** the system shows whether the issue is still open, being addressed, or resolved  
**Priority:** P1  
**Independent test:** Update an issue status and confirm that the new status is saved  
**Acceptance scenarios:** See US-13.3 under Acceptance Criteria

### US-13.4: View vehicle issue history
**As an** area administrator  
**I want to** view previously reported issues for a vehicle  
**So that** I can identify recurring problems and review the vehicle's history  
**Priority:** P2  
**Independent test:** Open a vehicle's issue history and confirm that previously reported issues are displayed  
**Acceptance scenarios:** See US-13.4 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** A user must be signed in to report a vehicle issue.
-- **FR-002:** A requestor can report an issue with a vehicle before, during, or after a trip.
-- **FR-003:** A reported issue must be associated with the correct vehicle.
-- **FR-004:** A reported issue can be associated with a reservation when applicable.
-- **FR-005:** The system must record the user who reported the issue.
-- **FR-006:** The system must record the issue type, description, and report date.
-- **FR-007:** The system must support issue types such as Low Gas, Dirty Vehicle, and Maintenance Needed.
-- **FR-008:** A requestor must be able to provide a description of the reported issue.
-- **FR-009:** An area administrator can view issues associated with vehicles assigned to their area.
-- **FR-010:** A system administrator can view issues across all areas.
-- **FR-011:** An authorized area administrator or system administrator can update an issue's status.
-- **FR-012:** The system must support Open, In Progress, and Resolved issue statuses.
-- **FR-013:** The system must display issue information and status to authorized users.
-- **FR-014:** The system must prevent unauthorized users from viewing or updating restricted issue records.
-- **FR-015:** The system must validate required information before saving an issue.
-- **FR-016:** The system must display a confirmation when an issue is reported successfully.
-- **FR-017:** The system must display an appropriate error message when an issue cannot be reported or updated.
-- **FR-018:** Reporting an issue must not automatically mark a reservation as Returned.
-- **FR-019:** Reporting an issue must not automatically mark an issue as Resolved.
-- **FR-020:** The system must retain reported issues so authorized administrators can review vehicle issue history.

---

## Assumptions

- Feature 1 authentication and session handling MUST be implemented before this feature.
- Vehicle Management and Vehicle Reservation Management provide the vehicle and reservation information.
- Each issue must be associated with a valid vehicle.
- An issue may be associated with a reservation when it relates to a specific trip.
- A requestor can report an issue related to their own reservation.
- Area administrators can view and manage issues for vehicles assigned to their area.
- System administrators can view and manage issues across all areas.
- Maintenance work and service records are handled by the Vehicle Maintenance and Service Log features.
- Email notifications for reported issues are handled separately if included in the Email Notifications feature.

## Edge Cases

- Vehicle does not exist → issue report rejected.
- Issue type is missing → issue report rejected.
- Description is missing → issue report rejected.
- Invalid issue type → `400`.
- Reservation ID does not exist → `404`.
- Requestor attempts to report an issue against another user's reservation → access denied.
- Area administrator attempts to view an issue for a vehicle outside their area → access denied.
- Unauthenticated caller → `401`.
- Unauthorized caller attempts to update issue status → `403`.
- Issue ID does not exist → `404`.
- Issue status is invalid → `400`.
- Duplicate submission → duplicate issue records should be avoided when the same request is accidentally submitted more than once.
- Issue report or status update fails → the issue must not be partially updated.

## Success Criteria

- **SC-001:** A requestor can successfully report an issue for a vehicle.
- **SC-002:** Issue type, description, reporting user, vehicle, and report date are saved correctly.
- **SC-003:** An authorized area administrator can view issues for vehicles in their area.
- **SC-004:** A system administrator can view issues across all areas.
- **SC-005:** Authorized administrators can update issue statuses.
- **SC-006:** Unauthorized users cannot view or update restricted issue records.
- **SC-007:** Every acceptance scenario has at least one automated test before merge.

---

## Data Ownership & Isolation

Vehicle issue information belongs to the associated vehicle and, when applicable, the associated reservation.

| Rule | Requirement |
|------|-------------|
| **Requestor access** | A requestor can report issues for vehicles they are authorized to use |
| **Area administrator access** | An area administrator can view and manage issues for vehicles assigned to their area |
| **System administrator access** | A system administrator can view and manage issues across all areas |
| **Maintenance access** | Authorized maintenance users can view relevant vehicle issues |
| **Vehicle association** | Every issue must reference the correct vehicle |
| **Reservation association** | An issue may reference the reservation related to the reported problem |
| **Reporting user** | Every issue must identify the user who reported it |
| **Status updates** | Only an authorized administrator can update an issue's status |
| **Unauthenticated access** | Unauthenticated callers receive `401` |

A requestor must not be allowed to report an issue against another person's reservation by changing the reservation ID in an API request.

## Key Entities

- **Vehicle Issue:** The reported problem associated with a vehicle.
- **Vehicle:** The vehicle that has the reported issue.
- **Reservation:** The trip or reservation associated with the issue, when applicable.
- **User:** The requestor or administrator performing an operation.
- **Area:** The department responsible for managing the vehicle, such as Athletics, Support Central, or Maintenance.

## API Requirements

The proposed mount prefix is `/vehicleapi`. Final paths must follow the existing project conventions.

All endpoints require authentication.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/vehicleapi/issues` | Yes | View vehicle issues the user is authorized to access |
| `GET` | `/vehicleapi/issues/:id` | Yes | View details of one reported issue |
| `POST` | `/vehicleapi/issues` | Requestor/Authorized User | Report a vehicle issue |
| `PATCH` | `/vehicleapi/issues/:id/status` | Area Admin/System Admin | Update an issue's status |
| `GET` | `/vehicleapi/vehicles/:id/issues` | Yes | View issue history for a vehicle |

### Issue report request

The system records the reporting user and report date automatically.

**Example request:**
```json
{
  "vehicle_id": 4,
  "reservation_id": 12,
  "issue_type": "Low Gas",
  "description": "The vehicle has less than one-quarter tank of gas."
}
```

**Example success response (`201`):**
```json
{
  "message": "Vehicle issue reported successfully.",
  "issue": {
    "issue_id": 1,
    "vehicle_id": 4,
    "reservation_id": 12,
    "reported_by": 7,
    "issue_type": "Low Gas",
    "description": "The vehicle has less than one-quarter tank of gas.",
    "reported_date": "2026-11-05T17:00:00",
    "status": "Open"
  }
}
```

### Update issue status request

Only an authorized area administrator or system administrator can update the status.

**Example request:**
```json
{
  "status": "In Progress"
}
```

**Supported statuses:**

- `Open`
- `In Progress`
- `Resolved`

**Example success response (`200`):**
```json
{
  "message": "Vehicle issue status updated successfully.",
  "issue": {
    "issue_id": 1,
    "vehicle_id": 4,
    "reservation_id": 12,
    "issue_type": "Low Gas",
    "description": "The vehicle has less than one-quarter tank of gas.",
    "status": "In Progress"
  }
}
```

### Error responses

Error response format:
```json
{
  "message": "Human-readable explanation."
}
```

- Missing or invalid input → `400`.
- Unauthenticated caller → `401`.
- Insufficient permissions → `403`.
- Vehicle, reservation, or issue not found → `404`.
- Conflicting update or duplicate submission → `409`.
- Unexpected server error → `500`.

---

## Screen Requirements

Follow the existing project's UI style and navigation conventions.

### [View: Vehicle Issue Reporting]

- **Purpose:** Allow requestors to report vehicle issues and allow authorized administrators to review and manage reported issues.
- **Requestor view:** Show a form to select or confirm the vehicle, select the issue type, and enter a description.
- **Issue types:** Provide options such as Low Gas, Dirty Vehicle, and Maintenance Needed.
- **Reservation information:** Allow the requestor to associate the issue with a relevant reservation when applicable.
- **Primary action:** **Report Issue** — saves the reported vehicle issue.
- **Area administrator view:** Show issues associated with vehicles assigned to the administrator's area.
- **Administrator action:** **Update Status** — allows an authorized administrator to change an issue's status.
- **Issue history:** Allow authorized users to view previously reported issues for a selected vehicle.
- **Loading:** Display a loading indicator while issue information is retrieved or submitted.
- **Success:** Display a confirmation when an issue is reported or updated.
- **Error:** Display API errors in the project's standard error component.
- **Status display:** Refresh issue information after a successful status update.

---

## Data Model Requirements

This feature uses the existing `vehicle_issues` table. It does not require a separate vehicle issue table.

### `vehicle_issues` table

| Field | Type | Rules |
|-------|------|-------|
| `issue_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | Foreign key referencing `vehicles.vehicle_id`, NOT NULL |
| `reservation_id` | INTEGER | Nullable foreign key referencing `reservations.reservation_id` |
| `reported_by` | INTEGER | Foreign key referencing `users.user_id`, NOT NULL |
| `issue_type` | VARCHAR | NOT NULL |
| `description` | TEXT | NOT NULL |
| `reported_date` | DATETIME | NOT NULL |
| `status` | VARCHAR | NOT NULL, default `Open` |

The existing `vehicle_issues` table in the shared data model already includes `issue_id`, `reservation_id`, `vehicle_id`, `reported_by`, `issue_type`, `description`, and `reported_date`.

Confirm whether the `status` field exists in the current shared schema. If it does not, coordinate the schema change with the team before adding it.

### Status values

Relevant issue status values for this feature:

- `Open`
- `In Progress`
- `Resolved`

### Associations

- A vehicle can have many reported issues.
- A reservation can have many reported issues, when issues are associated with trips.
- A user can report many issues.
- Each issue belongs to one vehicle and one reporting user.
- Each issue may belong to a reservation.

---

## Acceptance Criteria (Gherkin)

### US-13.1 — Report a vehicle issue

#### Scenario: Requestor reports a vehicle issue

- **Given** I am signed in as an authorized requestor
- **And** the vehicle exists
- **When** I submit a valid issue type and description
- **Then** the system saves the issue
- **And** associates it with the correct vehicle
- **And** records the reporting user and report date
- **And** sets the issue status to `Open`
- **And** displays a confirmation message

#### Scenario: Requestor reports an issue associated with a reservation

- **Given** I am signed in as a requestor
- **And** I have an authorized reservation with an assigned vehicle
- **When** I report an issue associated with that reservation
- **Then** the system associates the issue with the correct reservation and vehicle

#### Scenario: Requestor submits an incomplete issue report

- **Given** I am signed in as a requestor
- **When** I submit an issue report without an issue type or description
- **Then** the system rejects the report
- **And** displays a validation message

#### Scenario: Requestor reports an issue against another user's reservation

- **Given** I am signed in as a requestor
- **And** the reservation belongs to another user
- **When** I attempt to report an issue against that reservation
- **Then** the system denies access
- **And** no issue record is created

### US-13.2 — View reported vehicle issues

#### Scenario: Area administrator views issues for their area

- **Given** I am signed in as an area administrator
- **When** I open the vehicle issue list
- **Then** I can see issues associated with vehicles assigned to my area
- **And** each issue displays its type, description, reporting user, report date, and status

#### Scenario: Area administrator attempts to view an issue outside their area

- **Given** I am signed in as an area administrator
- **When** I attempt to access an issue for a vehicle outside my area
- **Then** the system denies access
- **And** restricted issue information is not displayed

#### Scenario: System administrator views all vehicle issues

- **Given** I am signed in as a system administrator
- **When** I open the vehicle issue list
- **Then** I can see issues across all areas

### US-13.3 — Update vehicle issue status

#### Scenario: Area administrator updates an issue status

- **Given** I am signed in as an authorized area administrator
- **And** an issue has the status `Open`
- **When** I change the issue status to `In Progress`
- **Then** the system saves the new status
- **And** displays the updated issue information

#### Scenario: Administrator resolves an issue

- **Given** I am signed in as an authorized administrator
- **And** an issue is being addressed
- **When** I change the issue status to `Resolved`
- **Then** the system saves the new status
- **And** displays the updated issue information

#### Scenario: Requestor attempts to update an issue status

- **Given** I am signed in as a requestor
- **When** I attempt to update an issue status
- **Then** the system returns `403`
- **And** the issue status remains unchanged

### US-13.4 — View vehicle issue history

#### Scenario: Administrator views vehicle issue history

- **Given** I am signed in as an authorized administrator
- **And** a vehicle has previously reported issues
- **When** I open the vehicle's issue history
- **Then** the system displays the issues associated with that vehicle
- **And** each issue displays its type, description, report date, and status

#### Scenario: Vehicle has no reported issues

- **Given** I am signed in as an authorized user
- **And** a vehicle has no reported issues
- **When** I open the vehicle's issue history
- **Then** the system displays an appropriate empty state

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-13.1 | Requestor reports a vehicle issue | `backend/tests/issues.test.js` | `it("Requestor reports a vehicle issue")` |
| US-13.1 | Requestor reports a vehicle issue | `frontend/tests/VehicleIssueReporting.test.js` | `it("Requestor reports a vehicle issue")` |
| US-13.1 | Requestor reports an issue associated with a reservation | `backend/tests/issues.test.js` | `it("Requestor reports an issue associated with a reservation")` |
| US-13.1 | Requestor reports an issue associated with a reservation | `frontend/tests/VehicleIssueReporting.test.js` | `it("Requestor reports an issue associated with a reservation")` |
| US-13.1 | Requestor submits an incomplete issue report | `backend/tests/issues.test.js` | `it("Requestor submits an incomplete issue report")` |
| US-13.1 | Requestor submits an incomplete issue report | `frontend/tests/VehicleIssueReporting.test.js` | `it("Requestor submits an incomplete issue report")` |
| US-13.1 | Requestor reports an issue against another user's reservation | `backend/tests/issues.test.js` | `it("Requestor reports an issue against another user's reservation")` |
| US-13.1 | Requestor reports an issue against another user's reservation | `frontend/tests/VehicleIssueReporting.test.js` | `it("Requestor reports an issue against another user's reservation")` |
| US-13.2 | Area administrator views issues for their area | `backend/tests/issues.test.js` | `it("Area administrator views issues for their area")` |
| US-13.2 | Area administrator views issues for their area | `frontend/tests/VehicleIssueReporting.test.js` | `it("Area administrator views issues for their area")` |
| US-13.2 | Area administrator attempts to view an issue outside their area | `backend/tests/issues.test.js` | `it("Area administrator attempts to view an issue outside their area")` |
| US-13.2 | Area administrator attempts to view an issue outside their area | `frontend/tests/VehicleIssueReporting.test.js` | `it("Area administrator attempts to view an issue outside their area")` |
| US-13.2 | System administrator views all vehicle issues | `backend/tests/issues.test.js` | `it("System administrator views all vehicle issues")` |
| US-13.2 | System administrator views all vehicle issues | `frontend/tests/VehicleIssueReporting.test.js` | `it("System administrator views all vehicle issues")` |
| US-13.3 | Area administrator updates an issue status | `backend/tests/issues.test.js` | `it("Area administrator updates an issue status")` |
| US-13.3 | Area administrator updates an issue status | `frontend/tests/VehicleIssueReporting.test.js` | `it("Area administrator updates an issue status")` |
| US-13.3 | Administrator resolves an issue | `backend/tests/issues.test.js` | `it("Administrator resolves an issue")` |
| US-13.3 | Administrator resolves an issue | `frontend/tests/VehicleIssueReporting.test.js` | `it("Administrator resolves an issue")` |
| US-13.3 | Requestor attempts to update an issue status | `backend/tests/issues.test.js` | `it("Requestor attempts to update an issue status")` |
| US-13.3 | Requestor attempts to update an issue status | `frontend/tests/VehicleIssueReporting.test.js` | `it("Requestor attempts to update an issue status")` |
| US-13.4 | Administrator views vehicle issue history | `backend/tests/issues.test.js` | `it("Administrator views vehicle issue history")` |
| US-13.4 | Administrator views vehicle issue history | `frontend/tests/VehicleIssueReporting.test.js` | `it("Administrator views vehicle issue history")` |
| US-13.4 | Vehicle has no reported issues | `backend/tests/issues.test.js` | `it("Vehicle has no reported issues")` |
| US-13.4 | Vehicle has no reported issues | `frontend/tests/VehicleIssueReporting.test.js` | `it("Vehicle has no reported issues")` |

---

## Agent Implementation Request

Copy when asking Cursor to implement this feature:

```text
Implement Feature 13 from @features/feature-13-vehicle-issue-reporting.md.

Before coding, inspect the existing project structure and shared feature references.

Follow the layer order in @features/framework.md:
models → routes → backend tests → frontend → frontend tests.

Reuse the existing authentication, vehicle, reservation, user, and area models.
Do not create duplicate vehicle, reservation, or vehicle issue tables.

Implement vehicle issue reporting, issue listing, issue status updates, and vehicle issue history.

Validate issue information, enforce requestor ownership and administrator area permissions, and implement the required screen behavior.

Map every Gherkin scenario in the Test Coverage Map to at least one automated test.

Run the project's test suite before finishing.

If API routes, payloads, schema, or product rules change, update the relevant shared reference files in the same branch.

Complete the Definition of Done and merge checklist in @features/framework.md.

Do not implement behavior outside this specification.
```

---

## Definition of Done

- [ ] Backend and frontend implemented according to this specification.
- [ ] Requestors can report vehicle issues.
- [ ] Issue types and descriptions are validated.
- [ ] Vehicle, optional reservation, and reporting user associations are saved correctly.
- [ ] Report date is recorded correctly.
- [ ] Issue status follows the agreed data model.
- [ ] Area-level access restrictions are enforced.
- [ ] System administrator access works across areas.
- [ ] Authorized administrators can update issue statuses.
- [ ] Vehicle issue history is available.
- [ ] All mapped automated tests pass.
- [ ] Test Coverage Map is complete.
- [ ] `features/reference/data-model.md` is updated if the schema changes.
- [ ] `features/reference/api.md` is updated if the API changes.
- [ ] `features/reference/behavior.md` is updated if product rules change.

---

## Out of Scope

- Registration, Google sign-in, session persistence, and logout (Feature 1).
- Creating or editing reservation requests.
- Assigning vehicles to reservations.
- Vehicle availability and double-booking prevention during assignment.
- Vehicle checkout and return (Feature 12).
- Performing maintenance or recording completed service.
- Recording vehicle mileage.
- Email notifications and pickup instructions (Feature 16).
- Creating or deleting fleet vehicles.
- Managing drivers or destinations.
- Automatically resolving reported issues.
