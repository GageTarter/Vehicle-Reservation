# Feature: Vehicle Maintenance Management

**Feature ID:** 14  
**Branch pattern:** `feature/14-vehicle-maintenance-management`  
**Status:** Draft  
**Created:** 2026-10-29  
**Input:** OC Vehicle Scheduling System requirements  
**Depends on:** Feature 1 — User Authentication, Vehicle Management, Vehicle Issue Reporting  
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-14.1: View maintenance requests
**As a** maintenance user  
**I want to** view maintenance requests for vehicles in my assigned area  
**So that** I can keep track of vehicle problems that need attention  
**Priority:** P1  
**Independent test:** Open the maintenance request list and confirm that authorized requests are displayed  
**Acceptance scenarios:** See US-14.1 under Acceptance Criteria

### US-14.2: Create a maintenance request
**As a** maintenance user  
**I want to** create a maintenance request for a vehicle  
**So that** vehicle problems can be documented and addressed  
**Priority:** P1  
**Independent test:** Create a maintenance request and confirm that it is saved with the correct vehicle and description  
**Acceptance scenarios:** See US-14.2 under Acceptance Criteria

### US-14.3: Update maintenance request status
**As a** maintenance user  
**I want to** update the status of a maintenance request  
**So that** the system reflects the progress of maintenance work  
**Priority:** P1  
**Independent test:** Change a maintenance request from Open to In Progress or Completed and confirm that the updated status is saved  
**Acceptance scenarios:** See US-14.3 under Acceptance Criteria

### US-14.4: View vehicle maintenance information
**As a** maintenance user  
**I want to** view maintenance requests associated with a vehicle  
**So that** I can review the vehicle's maintenance history  
**Priority:** P2  
**Independent test:** Open a vehicle's maintenance information and confirm that its associated maintenance requests are displayed  
**Acceptance scenarios:** See US-14.4 under Acceptance Criteria

---

## Requirements

## Functional Requirements

-- **FR-001:** A user must be signed in to access maintenance management features.
-- **FR-002:** An authorized maintenance user must be able to view maintenance requests for vehicles they are permitted to manage.
-- **FR-003:** A maintenance user must be able to create a maintenance request for an existing vehicle.
-- **FR-004:** Every maintenance request must be associated with one vehicle.
-- **FR-005:** A maintenance request may optionally be associated with an existing vehicle issue.
-- **FR-006:** A maintenance request must include a description of the maintenance problem or work needed.
-- **FR-007:** The system must assign a new maintenance request the initial status `Open`.
-- **FR-008:** An authorized maintenance user must be able to update a maintenance request's status.
-- **FR-009:** The system must support the maintenance request statuses `Open`, `In Progress`, and `Completed`.
-- **FR-010:** An area administrator must be able to view maintenance requests associated with vehicles in their area.
-- **FR-011:** A system administrator must be able to view and manage maintenance requests across all areas.
-- **FR-012:** The system must validate that the selected vehicle exists before creating a maintenance request.
-- **FR-013:** If an issue is selected, the system must validate that the issue exists and is associated with the selected vehicle.
-- **FR-014:** The system must display the maintenance request's vehicle, description, and current status.
-- **FR-015:** The system must prevent unauthorized users from viewing or updating maintenance requests outside their permitted access.

---

## Assumptions

- Feature 1 authentication and session handling MUST be implemented before this feature.
- Vehicle Management provides the existing vehicle information.
- Vehicle Issue Reporting provides the vehicle issues that may be associated with maintenance requests.
- Maintenance users are authorized to manage maintenance requests.
- Area administrators can access maintenance requests for vehicles belonging to their area.
- System administrators can access maintenance requests across all areas.
- Each maintenance request is associated with one vehicle.
- A maintenance request may be linked to one existing vehicle issue, but an issue association is optional.
- Mileage tracking and detailed service records are handled by the Vehicle Mileage and Service Log Management feature.
- The existing `maintenance_requests` table will be reused rather than creating a duplicate table.

## Edge Cases

- Maintenance request created without a vehicle ID → `400`.
- Maintenance request created without a description → `400`.
- Vehicle ID does not exist → `404`.
- Selected issue does not exist → `404`.
- Selected issue belongs to a different vehicle → request rejected.
- Invalid maintenance request status → `400`.
- Maintenance request ID does not exist → `404`.
- Unauthenticated caller → `401`.
- User attempts to access a maintenance request outside their area → `403`.
- User attempts to update a request without permission → `403`.
- Maintenance request creation or update fails → no partial changes should be saved.
- Maintenance request is already Completed → duplicate completion should not create duplicate records or unintended changes.

## Success Criteria

- **SC-001:** An authorized maintenance user can view maintenance requests.
- **SC-002:** An authorized maintenance user can create a maintenance request for an existing vehicle.
- **SC-003:** A maintenance request is saved with the correct vehicle and optional issue association.
- **SC-004:** Maintenance request descriptions and statuses are displayed correctly.
- **SC-005:** Authorized users can update maintenance request statuses.
- **SC-006:** Area and system administrator access restrictions are enforced.
- **SC-007:** Every acceptance scenario has at least one automated test before merge.

---

## Data Ownership & Isolation

Maintenance requests belong to the vehicle they are associated with.

| Rule | Requirement |
|------|-------------|
| **Maintenance user access** | An authorized maintenance user can view and manage permitted maintenance requests |
| **Area administrator access** | An area administrator can view and manage maintenance requests for vehicles in their area |
| **System administrator access** | A system administrator can manage maintenance requests across all areas |
| **Vehicle association** | Every maintenance request must belong to an existing vehicle |
| **Issue association** | A maintenance request may be associated with an existing issue for the same vehicle |
| **Status updates** | Only authorized users can update maintenance request statuses |
| **Unauthenticated access** | Unauthenticated callers receive `401` |

A user must not be allowed to access or update maintenance requests outside their permitted area by changing the maintenance request ID in an API request.

## Key Entities

- **Maintenance Request:** A record describing maintenance work or attention needed for a vehicle.
- **Vehicle:** The vehicle associated with the maintenance request.
- **Vehicle Issue:** An optional issue that may be connected to a maintenance request.
- **User:** The maintenance user or administrator creating or updating a maintenance request.
- **Area:** The department responsible for managing the vehicle and its maintenance requests.

## API Requirements

The proposed mount prefix is `/vehicleapi`. Final paths must follow the existing project conventions.

All endpoints require authentication.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/vehicleapi/maintenance-requests` | Maintenance User/Admin | View authorized maintenance requests |
| `GET` | `/vehicleapi/maintenance-requests/:id` | Maintenance User/Admin | View a specific maintenance request |
| `POST` | `/vehicleapi/maintenance-requests` | Maintenance User/Admin | Create a maintenance request |
| `PATCH` | `/vehicleapi/maintenance-requests/:id/status` | Maintenance User/Admin | Update a maintenance request status |
| `GET` | `/vehicleapi/vehicles/:id/maintenance` | Maintenance User/Admin | View maintenance requests associated with a vehicle |

### Maintenance request creation

The system must validate the vehicle ID and description. The issue ID is optional.

**Example request:**
```json
{
  "vehicle_id": 4,
  "issue_id": 2,
  "description": "Vehicle needs inspection because of an engine warning light."
}
```

**Example success response (`201`):**
```json
{
  "message": "Maintenance request created successfully.",
  "maintenance_request": {
    "maintenance_request_id": 1,
    "vehicle_id": 4,
    "issue_id": 2,
    "description": "Vehicle needs inspection because of an engine warning light.",
    "status": "Open"
  }
}
```

### Update maintenance request status

The system must validate the requested status before saving the update.

**Example request:**
```json
{
  "status": "In Progress"
}
```

**Example success response (`200`):**
```json
{
  "message": "Maintenance request status updated successfully.",
  "maintenance_request": {
    "maintenance_request_id": 1,
    "vehicle_id": 4,
    "issue_id": 2,
    "description": "Vehicle needs inspection because of an engine warning light.",
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

- Missing or invalid required fields → `400`.
- Unauthenticated caller → `401`.
- Insufficient permissions → `403`.
- Vehicle, issue, or maintenance request not found → `404`.
- Invalid or conflicting operation → `409`.
- Unexpected server error → `500`.

---

## Screen Requirements

Follow the existing project's UI style and navigation conventions.

### [View: Vehicle Maintenance Management]

- **Purpose:** Allow authorized maintenance users and administrators to view, create, and manage maintenance requests.
- **Maintenance request list:** Show maintenance request ID, vehicle, description, status, and associated issue when available.
- **Create request:** Provide a form to select a vehicle, optionally select an existing vehicle issue, and enter a maintenance description.
- **Vehicle selection:** Display available vehicles that the user is authorized to manage.
- **Issue selection:** Allow the user to select an existing issue associated with the chosen vehicle. This field is optional.
- **Status display:** Show the current maintenance request status.
- **Status action:** Allow authorized users to change the status to `In Progress` or `Completed`.
- **Vehicle maintenance information:** Allow users to view maintenance requests associated with a selected vehicle.
- **Loading:** Display a loading indicator while maintenance information is retrieved.
- **Success:** Display a confirmation when a maintenance request is created or updated.
- **Error:** Display API errors in the project's standard error component.
- **Empty state:** Display an appropriate message when no maintenance requests are available.

---

## Data Model Requirements

This feature uses the existing `maintenance_requests` table. It must not create a duplicate maintenance request table.

### `maintenance_requests` table

| Field | Type | Rules |
|-------|------|-------|
| `maintenance_request_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | Foreign key referencing `vehicles.vehicle_id`; NOT NULL |
| `issue_id` | INTEGER | Nullable foreign key referencing `vehicle_issues.issue_id` |
| `description` | TEXT | NOT NULL |
| `status` | VARCHAR | NOT NULL; defaults to `Open` |

The existing `vehicles` and `vehicle_issues` tables remain part of the shared data model.

**Note:** A creation date/time field is not currently listed in the agreed shared `maintenance_requests` table. Confirm with the team before adding one.

### Status values

Relevant maintenance request statuses:

- `Open`
- `In Progress`
- `Completed`

### Associations

- A vehicle can have multiple maintenance requests.
- Each maintenance request belongs to one vehicle.
- A maintenance request may be associated with one vehicle issue.
- A vehicle issue may be associated with a maintenance request.
- Maintenance requests are accessed according to the area associated with their vehicle.

---

## Acceptance Criteria (Gherkin)

### US-14.1 — View maintenance requests

#### Scenario: Maintenance user views authorized maintenance requests

- **Given** I am signed in as an authorized maintenance user
- **When** I open the maintenance management view
- **Then** I can see maintenance requests for vehicles I am permitted to manage
- **And** each request displays its vehicle, description, and status

#### Scenario: Area administrator views maintenance requests

- **Given** I am signed in as an area administrator
- **When** I open the maintenance management view
- **Then** I can see maintenance requests for vehicles in my area
- **And** I cannot see requests belonging to vehicles in other areas

#### Scenario: No maintenance requests are available

- **Given** I am signed in as an authorized maintenance user
- **And** no maintenance requests exist for my permitted vehicles
- **When** I open the maintenance management view
- **Then** the system displays an appropriate empty state

### US-14.2 — Create a maintenance request

#### Scenario: Maintenance user creates a maintenance request

- **Given** I am signed in as an authorized maintenance user
- **And** I select an existing vehicle
- **And** I enter a maintenance description
- **When** I submit the maintenance request
- **Then** the system creates the maintenance request
- **And** the request is associated with the selected vehicle
- **And** the initial status is `Open`

#### Scenario: Maintenance user creates a request linked to an issue

- **Given** I am signed in as an authorized maintenance user
- **And** I select a vehicle with an existing issue
- **And** I select that issue
- **When** I submit the maintenance request
- **Then** the system creates the request
- **And** the request is associated with the selected vehicle and issue

#### Scenario: Maintenance user creates a request without an issue

- **Given** I am signed in as an authorized maintenance user
- **And** I select an existing vehicle
- **And** I enter a maintenance description
- **And** I do not select an issue
- **When** I submit the maintenance request
- **Then** the system creates the request
- **And** the issue association remains empty

#### Scenario: Maintenance user submits a request without a description

- **Given** I am signed in as an authorized maintenance user
- **And** I select an existing vehicle
- **And** I leave the description empty
- **When** I submit the maintenance request
- **Then** the system rejects the request
- **And** no maintenance request is created

#### Scenario: Maintenance user selects a vehicle that does not exist

- **Given** I am signed in as an authorized maintenance user
- **And** the selected vehicle does not exist
- **When** I submit the maintenance request
- **Then** the system rejects the request
- **And** no maintenance request is created

#### Scenario: Maintenance user selects an issue belonging to another vehicle

- **Given** I am signed in as an authorized maintenance user
- **And** I select a vehicle
- **And** I select an issue associated with a different vehicle
- **When** I submit the maintenance request
- **Then** the system rejects the request
- **And** no maintenance request is created

### US-14.3 — Update maintenance request status

#### Scenario: Maintenance user updates a request to In Progress

- **Given** I am signed in as an authorized maintenance user
- **And** a maintenance request has status `Open`
- **When** I update the status to `In Progress`
- **Then** the system saves the updated status
- **And** the updated status is displayed

#### Scenario: Maintenance user completes a maintenance request

- **Given** I am signed in as an authorized maintenance user
- **And** a maintenance request has status `In Progress`
- **When** I update the status to `Completed`
- **Then** the system saves the updated status
- **And** the request displays `Completed`

#### Scenario: User submits an invalid maintenance status

- **Given** I am signed in as an authorized maintenance user
- **And** a maintenance request exists
- **When** I submit a status that is not supported
- **Then** the system rejects the update
- **And** the original status remains unchanged

#### Scenario: Unauthorized user attempts to update a maintenance request

- **Given** I am signed in as a user without maintenance permissions
- **And** a maintenance request exists
- **When** I attempt to update its status
- **Then** the system returns `403`
- **And** the maintenance request remains unchanged

### US-14.4 — View vehicle maintenance information

#### Scenario: Maintenance user views maintenance requests for a vehicle

- **Given** I am signed in as an authorized maintenance user
- **And** a vehicle has maintenance requests
- **When** I open the vehicle's maintenance information
- **Then** I can see the maintenance requests associated with that vehicle
- **And** each request displays its description and status

#### Scenario: Vehicle has no maintenance requests

- **Given** I am signed in as an authorized maintenance user
- **And** a vehicle has no maintenance requests
- **When** I open the vehicle's maintenance information
- **Then** the system displays an appropriate empty state

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-14.1 | Maintenance user views authorized maintenance requests | `backend/tests/maintenance.test.js` | `it("Maintenance user views authorized maintenance requests")` |
| US-14.1 | Maintenance user views authorized maintenance requests | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user views authorized maintenance requests")` |
| US-14.1 | Area administrator views maintenance requests | `backend/tests/maintenance.test.js` | `it("Area administrator views maintenance requests")` |
| US-14.1 | Area administrator views maintenance requests | `frontend/tests/VehicleMaintenance.test.js` | `it("Area administrator views maintenance requests")` |
| US-14.1 | No maintenance requests are available | `backend/tests/maintenance.test.js` | `it("No maintenance requests are available")` |
| US-14.1 | No maintenance requests are available | `frontend/tests/VehicleMaintenance.test.js` | `it("No maintenance requests are available")` |
| US-14.2 | Maintenance user creates a maintenance request | `backend/tests/maintenance.test.js` | `it("Maintenance user creates a maintenance request")` |
| US-14.2 | Maintenance user creates a maintenance request | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user creates a maintenance request")` |
| US-14.2 | Maintenance user creates a request linked to an issue | `backend/tests/maintenance.test.js` | `it("Maintenance user creates a request linked to an issue")` |
| US-14.2 | Maintenance user creates a request linked to an issue | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user creates a request linked to an issue")` |
| US-14.2 | Maintenance user creates a request without an issue | `backend/tests/maintenance.test.js` | `it("Maintenance user creates a request without an issue")` |
| US-14.2 | Maintenance user creates a request without an issue | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user creates a request without an issue")` |
| US-14.2 | Maintenance user submits a request without a description | `backend/tests/maintenance.test.js` | `it("Maintenance user submits a request without a description")` |
| US-14.2 | Maintenance user submits a request without a description | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user submits a request without a description")` |
| US-14.2 | Maintenance user selects a vehicle that does not exist | `backend/tests/maintenance.test.js` | `it("Maintenance user selects a vehicle that does not exist")` |
| US-14.2 | Maintenance user selects a vehicle that does not exist | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user selects a vehicle that does not exist")` |
| US-14.2 | Maintenance user selects an issue belonging to another vehicle | `backend/tests/maintenance.test.js` | `it("Maintenance user selects an issue belonging to another vehicle")` |
| US-14.2 | Maintenance user selects an issue belonging to another vehicle | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user selects an issue belonging to another vehicle")` |
| US-14.3 | Maintenance user updates a request to In Progress | `backend/tests/maintenance.test.js` | `it("Maintenance user updates a request to In Progress")` |
| US-14.3 | Maintenance user updates a request to In Progress | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user updates a request to In Progress")` |
| US-14.3 | Maintenance user completes a maintenance request | `backend/tests/maintenance.test.js` | `it("Maintenance user completes a maintenance request")` |
| US-14.3 | Maintenance user completes a maintenance request | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user completes a maintenance request")` |
| US-14.3 | User submits an invalid maintenance status | `backend/tests/maintenance.test.js` | `it("User submits an invalid maintenance status")` |
| US-14.3 | User submits an invalid maintenance status | `frontend/tests/VehicleMaintenance.test.js` | `it("User submits an invalid maintenance status")` |
| US-14.3 | Unauthorized user attempts to update a maintenance request | `backend/tests/maintenance.test.js` | `it("Unauthorized user attempts to update a maintenance request")` |
| US-14.3 | Unauthorized user attempts to update a maintenance request | `frontend/tests/VehicleMaintenance.test.js` | `it("Unauthorized user attempts to update a maintenance request")` |
| US-14.4 | Maintenance user views maintenance requests for a vehicle | `backend/tests/maintenance.test.js` | `it("Maintenance user views maintenance requests for a vehicle")` |
| US-14.4 | Maintenance user views maintenance requests for a vehicle | `frontend/tests/VehicleMaintenance.test.js` | `it("Maintenance user views maintenance requests for a vehicle")` |
| US-14.4 | Vehicle has no maintenance requests | `backend/tests/maintenance.test.js` | `it("Vehicle has no maintenance requests")` |
| US-14.4 | Vehicle has no maintenance requests | `frontend/tests/VehicleMaintenance.test.js` | `it("Vehicle has no maintenance requests")` |

---

## Definition of Done

- [ ] Backend and frontend implemented according to this specification.
- [ ] Authorized maintenance users can view maintenance requests.
- [ ] Maintenance requests can be created for existing vehicles.
- [ ] Optional issue associations are validated and saved correctly.
- [ ] Maintenance request descriptions and statuses are displayed correctly.
- [ ] Maintenance request statuses can be updated by authorized users.
- [ ] Area-based and system administrator permissions are enforced.
- [ ] Vehicle maintenance information displays associated requests.
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
- Vehicle availability and double-booking prevention.
- Vehicle issue reporting (Feature 13).
- Vehicle checkout and return management (Feature 12).
- Mileage tracking and service logging (Feature 15).
- Email notifications and pickup instructions (Feature 16).
- Vehicle, driver, and destination management.
- Automatically resolving vehicle issues when a maintenance request is completed.
- Detailed service records and maintenance cost tracking.