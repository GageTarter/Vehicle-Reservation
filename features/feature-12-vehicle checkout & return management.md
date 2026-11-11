# Feature: Vehicle Checkout & Return Management

**Feature ID:** 12  
**Branch pattern:** `feature/12-vehicle-checkout-return-management`  
**Status:** Draft  
**Created:** 2026-10-25  
**Input:** OC Vehicle Scheduling System requirements  
**Depends on:** [Feature 1 — Google Authentication](feature-1-google-auth.md), [Feature 3 — Vehicle Management](feature-3-vehicle-management.md), [Feature 8 — Vehicle Reservation Requests](feature-8-vehicle-reservation-requests.md), [Feature 9 — Vehicle Assignment and Availability](feature-9-vehicle-assignment-and-availability.md)  
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-12.1: Record vehicle checkout
**As a** requestor  
**I want to** record when I pick up my assigned vehicle  
**So that** the system knows when the vehicle was checked out  
**Priority:** P1  
**Independent test:** Check out an assigned vehicle and confirm that the checkout date and time are saved  
**Acceptance scenarios:** See US-12.1 under Acceptance Criteria

### US-12.2: View checkout information
**As a** requestor  
**I want to** view the vehicle assigned to my reservation and its pickup information  
**So that** I know which vehicle to collect and where to pick it up  
**Priority:** P1  
**Independent test:** Open an assigned reservation and confirm that the vehicle and pickup information are displayed  
**Acceptance scenarios:** See US-12.2 under Acceptance Criteria

### US-12.3: Mark a vehicle as returned
**As an** area administrator  
**I want to** mark a reservation as returned  
**So that** the system records that the vehicle has been brought back  
**Priority:** P1  
**Independent test:** Mark a checked-out reservation as returned and confirm that the return date and time are saved  
**Acceptance scenarios:** See US-12.3 under Acceptance Criteria

### US-12.4: View checkout and return status
**As an** area administrator  
**I want to** view reservations and their checkout and return statuses  
**So that** I can track which vehicles are in use and which have been returned  
**Priority:** P1  
**Independent test:** Open the checkout and return list and confirm that reservations display their status and assigned vehicle  
**Acceptance scenarios:** See US-12.4 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** A requestor must be signed in to view their reservations and assigned vehicle information.
-- **FR-002:** A requestor can view checkout and return information for their own reservations.
-- **FR-003:** A requestor can record checkout of an assigned vehicle for their reservation.
-- **FR-004:** A reservation must have an assigned vehicle before checkout can be recorded.
-- **FR-005:** The system must record the actual checkout date and time.
-- **FR-006:** An area administrator can view reservations and checkout/return statuses for the area they manage.
-- **FR-007:** An area administrator can mark a checked-out reservation as Returned.
-- **FR-008:** The system must record the actual return date and time when the reservation is marked as Returned.
-- **FR-009:** The reservation status must change to Returned when an authorized administrator confirms the return.
-- **FR-010:** The system must prevent a reservation from being checked out more than once without an appropriate status reset.
-- **FR-011:** The system must prevent a reservation from being marked as Returned if the vehicle has not been checked out.
-- **FR-012:** A requestor must not be able to mark their reservation as Returned. Only an authorized area administrator or system administrator can perform this action.
-- **FR-013:** Checkout and return information must be associated with the correct reservation and assigned vehicle.
-- **FR-014:** The system must display the current reservation status and checkout/return times when available.

---

## Assumptions

- Feature 1 authentication and session handling MUST be implemented before this feature.
- Vehicle Reservation Management and Vehicle Assignment and Availability Management provide the reservation and assigned vehicle information.
- Each reservation has no more than one assigned vehicle in this version of the system.
- Only an assigned reservation can be checked out.
- The requestor records the vehicle pickup, and an area administrator confirms the return.
- Pickup and return instructions are handled by the Email Notifications and Pickup Instructions feature.
- Reporting vehicle problems is handled by the Vehicle Issue Reporting feature.

## Edge Cases

- Reservation without an assigned vehicle → checkout rejected.
- Reservation already checked out → duplicate checkout rejected.
- Reservation already returned → duplicate return rejected.
- Reservation not checked out → return rejected.
- Requestor attempts to mark a reservation as Returned → `403`.
- Unauthenticated caller → `401`.
- Non-numeric reservation ID → `400`.
- Reservation ID does not exist → `404`.
- Reservation belongs to another requestor → access denied.
- Checkout or return operation fails → reservation must not be partially updated.

## Success Criteria

- **SC-001:** A requestor can record checkout for an assigned reservation.
- **SC-002:** Checkout and return date/time values are saved correctly.
- **SC-003:** An authorized area administrator can mark a checked-out reservation as Returned.
- **SC-004:** Reservation status and checkout/return information are displayed correctly.
- **SC-005:** Unauthorized users cannot perform checkout or return actions.
- **SC-006:** Every acceptance scenario has at least one automated test before merge.

---

## Data Ownership & Isolation

Checkout and return information belongs to the associated reservation.

| Rule | Requirement |
|------|-------------|
| **Requestor access** | A requestor can view their own reservations and associated vehicle information |
| **Checkout access** | A requestor can check out only their own assigned reservation |
| **Area administrator access** | An area administrator can view and manage reservations associated with their area |
| **System administrator access** | A system administrator can manage checkout and return operations across the system |
| **Return access** | Only an authorized area administrator or system administrator can mark a reservation as Returned |
| **Vehicle association** | Checkout and return information must relate to the vehicle assigned to the reservation |
| **Status integrity** | Only valid status transitions are allowed |
| **Unauthenticated access** | Unauthenticated callers receive `401` |

A requestor must not be allowed to access another person's reservation by changing the reservation ID in an API request.

## Key Entities

- **Reservation:** The vehicle request, including requestor, assigned vehicle, and status.
- **Vehicle:** The vehicle assigned to the reservation.
- **User:** The requestor or administrator performing an operation.
- **Checkout:** The actual date and time the vehicle was picked up.
- **Return:** The actual date and time the vehicle was returned and confirmed by an authorized administrator.

## API Requirements

The proposed mount prefix is `/vehicleapi`. Final paths must follow the existing project conventions.

All endpoints require authentication.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/vehicleapi/reservations/:id/checkout-return` | Yes | View checkout and return information |
| `POST` | `/vehicleapi/reservations/:id/checkout` | Requestor | Record vehicle checkout |
| `POST` | `/vehicleapi/reservations/:id/return` | Area Admin/System Admin | Mark a vehicle as returned |
| `GET` | `/vehicleapi/reservations/checkout-status` | Area Admin/System Admin | View reservations and checkout/return statuses |

### Checkout request

The system records the checkout date and time automatically.

**Example success response (`200`):**
```json
{
  "message": "Vehicle checkout recorded successfully.",
  "reservation": {
    "reservation_id": 12,
    "status": "Checked Out",
    "checkout_datetime": "2026-11-05T09:00:00",
    "return_datetime": null
  }
}
```

### Return request

The system records the return date and time automatically.

**Example success response (`200`):**
```json
{
  "message": "Vehicle return recorded successfully.",
  "reservation": {
    "reservation_id": 12,
    "status": "Returned",
    "checkout_datetime": "2026-11-05T09:00:00",
    "return_datetime": "2026-11-05T17:00:00"
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

- Invalid reservation ID → `400`.
- Unauthenticated caller → `401`.
- Insufficient permissions → `403`.
- Reservation not found → `404`.
- Invalid status transition or duplicate checkout/return → `409`.
- Unexpected server error → `500`.

---

## Screen Requirements

Follow the existing project's UI style and navigation conventions.

### [View: Checkout and Return]

- **Purpose:** Allow requestors to view assigned vehicle information and record checkout, and allow authorized administrators to confirm vehicle returns.
- **Requestor view:** Show reservation ID, assigned vehicle, reservation dates, status, checkout date/time, return date/time, and available pickup information.
- **Primary action:** **Check Out Vehicle** — records checkout for an eligible assigned reservation.
- **Area administrator view:** Show reservation ID, requestor, assigned vehicle, reservation dates, status, checkout date/time, and return date/time.
- **Administrator action:** **Mark as Returned** — confirms the return of a checked-out vehicle.
- **Checkout button:** Visible only when the reservation is assigned and eligible for checkout.
- **Return button:** Visible only to an authorized area administrator or system administrator for a checked-out reservation.
- **Loading:** Display a loading indicator while reservation information is retrieved.
- **Success:** Display a confirmation when checkout or return is recorded.
- **Error:** Display API errors in the project's standard error component.
- **Status display:** Refresh reservation information after a successful checkout or return.

---

## Data Model Requirements

This feature uses the existing `reservations` table. It does not require a separate checkout/return table for the basic functionality.

### `reservations` table

| Field | Type | Rules |
|-------|------|-------|
| `reservation_id` | INTEGER | Primary key |
| `requester_id` | INTEGER | Foreign key referencing `users.user_id` |
| `vehicle_id` | INTEGER | Nullable foreign key referencing `vehicles.vehicle_id` until a vehicle is assigned |
| `status` | VARCHAR | Current reservation status |
| `checkout_datetime` | DATETIME | Nullable; actual checkout date and time |
| `return_datetime` | DATETIME | Nullable; actual return date and time |

The existing reservation fields, such as driver, destination, start date/time, end date/time, and passenger count, remain part of the shared reservation model.

### Status values

Relevant status values for this feature:

- `Requested`
- `Awaiting Vehicle`
- `Assigned`
- `Checked Out`
- `Returned`

Other reservation statuses, such as `Rejected`, may be defined by the Reservation Management feature.

### Associations

- A reservation belongs to one requestor.
- A reservation may have one assigned vehicle.
- A vehicle can be assigned to different reservations over time, provided availability rules are satisfied.

---

## Acceptance Criteria (Gherkin)

### US-12.1 — Record vehicle checkout

#### Scenario: Requestor checks out an assigned vehicle

- **Given** I am signed in as the requestor for a reservation
- **And** my reservation has an assigned vehicle
- **And** the reservation status is `Assigned`
- **When** I click **Check Out Vehicle**
- **Then** the system records the checkout date and time
- **And** the reservation status changes to `Checked Out`
- **And** the updated reservation details are displayed

#### Scenario: Requestor tries to check out a reservation without a vehicle

- **Given** I am signed in as a requestor
- **And** my reservation does not have an assigned vehicle
- **When** I attempt to check out the vehicle
- **Then** the system rejects the operation
- **And** the reservation remains unchanged

#### Scenario: Requestor checks out a vehicle twice

- **Given** my reservation is already `Checked Out`
- **When** I attempt to check out the vehicle again
- **Then** the system rejects the operation
- **And** the original checkout date and time remain unchanged

### US-12.2 — View checkout information

#### Scenario: Requestor views an assigned reservation

- **Given** I am signed in as a requestor
- **And** my reservation has an assigned vehicle
- **When** I open the reservation details
- **Then** I can see the assigned vehicle and reservation dates
- **And** I can see the current reservation status
- **And** I can see checkout and return date/time values when available

#### Scenario: Requestor cannot view another user's reservation

- **Given** I am signed in as a requestor
- **And** a reservation belongs to another user
- **When** I attempt to access that reservation
- **Then** the system denies access
- **And** private reservation information is not displayed

### US-12.3 — Mark a vehicle as returned

#### Scenario: Area administrator marks a checked-out vehicle as returned

- **Given** I am signed in as an authorized area administrator
- **And** a reservation belongs to my area
- **And** the reservation status is `Checked Out`
- **When** I click **Mark as Returned**
- **Then** the system records the return date and time
- **And** the reservation status changes to `Returned`
- **And** the updated reservation details are displayed

#### Scenario: Area administrator tries to return a vehicle that was not checked out

- **Given** I am signed in as an area administrator
- **And** the reservation status is `Assigned`
- **When** I attempt to mark the reservation as returned
- **Then** the system rejects the operation
- **And** the reservation remains unchanged

#### Scenario: Requestor tries to mark a vehicle as returned

- **Given** I am signed in as a requestor
- **And** my reservation is `Checked Out`
- **When** I attempt to mark the reservation as returned
- **Then** the system returns `403`
- **And** the reservation remains `Checked Out`

#### Scenario: Area administrator attempts to return a vehicle twice

- **Given** a reservation is already `Returned`
- **When** I attempt to mark it as returned again
- **Then** the system rejects the operation
- **And** the original return date and time remain unchanged

### US-12.4 — View checkout and return statuses

#### Scenario: Area administrator views reservation statuses

- **Given** I am signed in as an area administrator
- **When** I open the checkout and return view
- **Then** I can see reservations associated with my area
- **And** each reservation displays its current status and assigned vehicle
- **And** checkout and return times are displayed when available

#### Scenario: No reservations require checkout or return

- **Given** I am signed in as an area administrator
- **And** no reservations are available in the selected list
- **When** I open the checkout and return view
- **Then** the system displays an appropriate empty state

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-12.1 | Requestor checks out an assigned vehicle | `backend/tests/checkout.test.js` | `it("Requestor checks out an assigned vehicle")` |
| US-12.1 | Requestor checks out an assigned vehicle | `frontend/tests/CheckoutReturn.test.js` | `it("Requestor checks out an assigned vehicle")` |
| US-12.1 | Requestor tries to check out a reservation without a vehicle | `backend/tests/checkout.test.js` | `it("Requestor tries to check out a reservation without a vehicle")` |
| US-12.1 | Requestor tries to check out a reservation without a vehicle | `frontend/tests/CheckoutReturn.test.js` | `it("Requestor tries to check out a reservation without a vehicle")` |
| US-12.1 | Requestor checks out a vehicle twice | `backend/tests/checkout.test.js` | `it("Requestor checks out a vehicle twice")` |
| US-12.1 | Requestor checks out a vehicle twice | `frontend/tests/CheckoutReturn.test.js` | `it("Requestor checks out a vehicle twice")` |
| US-12.2 | Requestor views an assigned reservation | `backend/tests/checkout.test.js` | `it("Requestor views an assigned reservation")` |
| US-12.2 | Requestor views an assigned reservation | `frontend/tests/CheckoutReturn.test.js` | `it("Requestor views an assigned reservation")` |
| US-12.2 | Requestor cannot view another user's reservation | `backend/tests/checkout.test.js` | `it("Requestor cannot view another user's reservation")` |
| US-12.2 | Requestor cannot view another user's reservation | `frontend/tests/CheckoutReturn.test.js` | `it("Requestor cannot view another user's reservation")` |
| US-12.3 | Area administrator marks a checked-out vehicle as returned | `backend/tests/checkout.test.js` | `it("Area administrator marks a checked-out vehicle as returned")` |
| US-12.3 | Area administrator marks a checked-out vehicle as returned | `frontend/tests/CheckoutReturn.test.js` | `it("Area administrator marks a checked-out vehicle as returned")` |
| US-12.3 | Area administrator tries to return a vehicle that was not checked out | `backend/tests/checkout.test.js` | `it("Area administrator tries to return a vehicle that was not checked out")` |
| US-12.3 | Area administrator tries to return a vehicle that was not checked out | `frontend/tests/CheckoutReturn.test.js` | `it("Area administrator tries to return a vehicle that was not checked out")` |
| US-12.3 | Requestor tries to mark a vehicle as returned | `backend/tests/checkout.test.js` | `it("Requestor tries to mark a vehicle as returned")` |
| US-12.3 | Requestor tries to mark a vehicle as returned | `frontend/tests/CheckoutReturn.test.js` | `it("Requestor tries to mark a vehicle as returned")` |
| US-12.3 | Area administrator attempts to return a vehicle twice | `backend/tests/checkout.test.js` | `it("Area administrator attempts to return a vehicle twice")` |
| US-12.3 | Area administrator attempts to return a vehicle twice | `frontend/tests/CheckoutReturn.test.js` | `it("Area administrator attempts to return a vehicle twice")` |
| US-12.4 | Area administrator views reservation statuses | `backend/tests/checkout.test.js` | `it("Area administrator views reservation statuses")` |
| US-12.4 | Area administrator views reservation statuses | `frontend/tests/CheckoutReturn.test.js` | `it("Area administrator views reservation statuses")` |
| US-12.4 | No reservations require checkout or return | `backend/tests/checkout.test.js` | `it("No reservations require checkout or return")` |
| US-12.4 | No reservations require checkout or return | `frontend/tests/CheckoutReturn.test.js` | `it("No reservations require checkout or return")` |

---

## Definition of Done

- [x] Backend and frontend implemented according to this specification.
- [x] Checkout and return timestamps are saved correctly.
- [x] Reservation status transitions are validated.
- [x] Requestor and administrator permissions are enforced.
- [x] Checkout and return information is displayed correctly.
- [x] All mapped automated tests pass.
- [x] Test Coverage Map is complete.
- [x] `features/reference/data-model.md` is updated if the schema changes.
- [x] `features/reference/api.md` is updated if the API changes.
- [x] `features/reference/behavior.md` is updated if product rules change.

---

## Out of Scope

- Registration, Google sign-in, session persistence, and logout (Feature 1).
- Creating or editing reservation requests.
- Assigning vehicles to reservations.
- Vehicle availability and double-booking prevention during assignment.
- Vehicle issue reporting (Feature 13).
- Vehicle maintenance and service logging (Features 14 and 15).
- Email notifications and pickup instructions (Feature 16).
- Vehicle management and driver management.

