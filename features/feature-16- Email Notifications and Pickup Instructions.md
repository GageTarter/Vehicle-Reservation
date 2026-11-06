# Feature: Email Notifications and Pickup Instructions

**Feature ID:** 16

**Branch:** `feature/16-email-notifications-and-pickup-instructions`

**Status:** Draft

**Created:** 2026-10-31

**Input:** OC Vehicle Scheduling System requirements

**Depends on:** Feature 1 — User Authentication, Reservation Management, Vehicle Assignment, Vehicle Checkout and Return Management, Area Management

**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## 1. User Stories

### US-16.1 Send Reservation Status Notifications

**As a** requestor,  
**I want** to receive an email when my reservation status changes,  
**So that** I know whether my reservation has been approved, assigned, or otherwise updated.

**Priority:** High

**Independent Test:** Change a reservation's status and verify that an email notification is sent to the requestor.

**Acceptance Scenarios:**

- Given a reservation status changes, when the change is saved, then the system sends an email to the requestor.
- Given a reservation status changes, when the notification is sent, then the email includes the reservation details and new status.
- Given a reservation status does not change, when the reservation is updated, then no status-change email is sent.

### US-16.2 Send Pickup and Return Instructions

**As a** requestor,  
**I want** to receive pickup and return instructions before my scheduled reservation,  
**So that** I know where and how to pick up and return the vehicle.

**Priority:** High

**Independent Test:** Create an assigned reservation and verify that the system sends the area's pickup and return instructions one day before the reservation.

**Acceptance Scenarios:**

- Given a reservation is scheduled, when the day-before notification is due, then the system sends the pickup and return instructions to the requestor.
- Given the reservation belongs to an area, when the email is prepared, then the system uses the instructions associated with that area.
- Given the area has contact information, when the email is sent, then the contact information is included.
- Given a reservation has been cancelled before the notification is due, then the system does not send the day-before instructions.

### US-16.3 Manage Area Pickup and Return Instructions

**As an** area admin,  
**I want** to create and update pickup and return instructions for my area,  
**So that** requestors receive the correct information for the vehicles they are using.

**Priority:** High

**Independent Test:** Update an area's pickup and return instructions and verify that the saved information appears in the next notification.

**Acceptance Scenarios:**

- Given an authorized area admin, when they open the instructions page, then they can view their area's instructions.
- Given an authorized area admin, when they update pickup or return instructions, then the system saves the changes.
- Given an area admin attempts to update another area's instructions, then the system denies access.
- Given a system admin, when they manage area instructions, then they can access instructions for all areas.

### US-16.4 View Email Notification History

**As an** authorized admin,  
**I want** to view email notification records,  
**So that** I can check whether reservation emails were sent.

**Priority:** Medium

**Independent Test:** Trigger an email notification and verify that a notification record is saved with its recipient, type, reservation, and sent date.

**Acceptance Scenarios:**

- Given an authorized admin, when they view notifications for a reservation, then the system displays its notification history.
- Given a notification is successfully sent, then the system records the recipient email, notification type, reservation, and sent date.
- Given a notification has not been sent successfully, then the system does not record it as successfully sent.
- Given an area admin views notification history, then they can only view notifications related to reservations within their area.

---

## 2. Requirements

The system must:

- Send email notifications when a reservation status changes.
- Send pickup and return instructions one day before a scheduled reservation.
- Use the pickup and return instructions associated with the reservation's area.
- Include relevant reservation information in notification emails.
- Include area contact information when available.
- Allow authorized area admins to manage their area's pickup and return instructions.
- Allow system admins to manage instructions for all areas.
- Save successfully sent email notifications in the database.
- Prevent unauthorized users from viewing or changing notification and instruction information.
- Avoid sending day-before instructions for cancelled reservations.

---

## 3. Functional Requirements

1. The system must require authentication for notification history and instruction management.
2. When a reservation status changes, the system must trigger a status-change email.
3. The status-change email must be sent to the reservation requestor.
4. The email must include the reservation ID, current status, and relevant reservation details.
5. The system must schedule pickup and return instruction emails for one day before the reservation's start date and time.
6. The system must identify the area associated with the reservation's assigned vehicle.
7. The system must retrieve the pickup instructions, return instructions, and contact information for that area.
8. The day-before email must include the reservation details, pickup instructions, return instructions, and available contact information.
9. The system must not send the day-before email if the reservation is cancelled before the notification is due.
10. The system must allow authorized area admins to view and update instructions for their own area.
11. The system must allow system admins to manage instructions across all areas.
12. The system must validate that the area exists before saving instructions.
13. The system must save an email notification record after the email provider confirms successful sending.
14. The notification record must include the reservation ID, recipient email, notification type, and sent date.
15. The system must prevent duplicate sending of the same scheduled notification for a reservation.
16. The system must handle email delivery failures and provide an appropriate error or retry mechanism.
17. The system must enforce area-level access restrictions for area admins.

---

## 4. Assumptions

- User authentication and reservation management already exist.
- Reservations are associated with vehicles, and vehicles are associated with areas.
- The system has access to a configured email service or SMTP provider.
- The requestor's email address is available through the existing users table.
- Area pickup and return instructions are stored in the `area_instructions` table.
- The system uses the reservation's assigned vehicle to identify its area.
- Area admins can manage instructions for their assigned area only.
- System admins can manage instructions for all areas.
- The system sends one day-before instructions email based on the reservation's start date and time.
- Email delivery requires a background scheduler or equivalent scheduled-job mechanism.
- The existing `email_notifications` table records successfully sent notifications.
- The system will use the existing reservation status values and will not introduce new reservation statuses for this feature.

---

## 5. Edge Cases

- The reservation has no assigned vehicle when the day-before notification is due.
- The reservation is cancelled before the scheduled email time.
- The reservation's requestor does not have a valid email address.
- The assigned vehicle or its area cannot be found.
- The area has no pickup or return instructions saved.
- The area has no contact information saved.
- The email provider is unavailable or rejects the message.
- The scheduled notification runs more than once.
- The reservation's start date or time changes after an email has been scheduled.
- The reservation status changes multiple times.
- An area admin attempts to access another area's instructions.
- A system admin manages instructions for an area with no existing instruction record.
- A notification is sent successfully, but saving its notification history record fails.

---

## 6. Success Criteria

- Requestors receive emails when their reservation status changes.
- Requestors receive pickup and return instructions one day before their scheduled reservation.
- Emails contain the correct reservation and area information.
- Area admins can manage instructions for their own areas.
- System admins can manage instructions across all areas.
- Successfully sent notifications are recorded in the database.
- Duplicate scheduled emails are prevented.
- Cancelled reservations do not receive day-before instructions.
- Email failures are handled without incorrectly recording an unsuccessful email as sent.
- Unauthorized users cannot access another area's instructions or notification history.

---

## 7. Data Ownership & Isolation

| Data | Owner | Access Rules |
|---|---|---|
| Email Notifications | System | Area admins can view notifications for reservations in their area. System admins can view all notifications. |
| Area Instructions | Area | Area admins can manage their own area's instructions. System admins can manage all areas. |
| Reservation Details | Reservation | Requestors can receive emails for their own reservations. Authorized admins can access reservations within their area. |
| User Email | User | Used by the system as the recipient address for reservation notifications. |

---

## 8. Key Entities

### Email Notifications

Tracks emails successfully sent by the system.

Fields:

- `notification_id` (PK)
- `reservation_id` (FK)
- `recipient_email`
- `notification_type`
- `sent_date`

### Area Instructions

Stores pickup and return information for each area.

Fields:

- `instruction_id` (PK)
- `area_id` (FK)
- `pickup_instructions`
- `return_instructions`
- `contact_information`

### Related Entities

- `reservations`: Provides reservation dates, status, requestor, and assigned vehicle.
- `users`: Provides the requestor's email address.
- `vehicles`: Identifies the vehicle assigned to a reservation and its associated area.
- `areas`: Identifies the area responsible for the vehicle and its instructions.

---

## 9. API Requirements

**Proposed API Mount:** `/vehicleapi`

### Proposed Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/vehicleapi/areas/:id/instructions` | Retrieve pickup and return instructions for an area. |
| PUT | `/vehicleapi/areas/:id/instructions` | Create or update an area's instructions. |
| GET | `/vehicleapi/reservations/:id/notifications` | Retrieve notification history for a reservation. |
| POST | `/vehicleapi/reservations/:id/notifications/send` | Trigger an authorized manual notification resend, if supported. |

**Note:** Automatic status-change and day-before emails should be triggered by backend events and scheduled jobs. They should not depend on a user manually calling an API endpoint.

### Request/Response Examples

**GET `/vehicleapi/areas/1/instructions`**

Example response:

```json
{
  "instruction_id": 1,
  "area_id": 1,
  "pickup_instructions": "Pick up the vehicle from the Athletics parking area.",
  "return_instructions": "Return the vehicle to the designated parking space.",
  "contact_information": "Contact the Athletics office for assistance."
}
```

**PUT `/vehicleapi/areas/1/instructions`**

Example request:

```json
{
  "pickup_instructions": "Pick up the vehicle from the Athletics office.",
  "return_instructions": "Return the vehicle to the designated parking area.",
  "contact_information": "Contact the Athletics office at the listed department email."
}
```

Example response:

```json
{
  "message": "Area instructions updated successfully."
}
```

**GET `/vehicleapi/reservations/10/notifications`**

Example response:

```json
[
  {
    "notification_id": 1,
    "reservation_id": 10,
    "recipient_email": "requestor@oc.edu",
    "notification_type": "Status Change",
    "sent_date": "2026-10-30T10:00:00"
  },
  {
    "notification_id": 2,
    "reservation_id": 10,
    "recipient_email": "requestor@oc.edu",
    "notification_type": "Pickup and Return Instructions",
    "sent_date": "2026-10-30T10:00:00"
  }
]
```

### Error Responses

| Status | Meaning | Example |
|---|---|---|
| 400 | Invalid request | Required instruction information is missing. |
| 401 | Unauthorized | User is not authenticated. |
| 403 | Forbidden | User cannot manage instructions for this area. |
| 404 | Not Found | Area, reservation, or notification history does not exist. |
| 409 | Conflict | Duplicate scheduled notification already exists. |
| 500 | Server Error | Unable to process the notification request. |

---

## 10. Screen Requirements

### Area Instructions Management Screen

**Purpose:** Allow authorized admins to manage pickup and return instructions.

**Components:**

- Area name.
- Pickup instructions text area.
- Return instructions text area.
- Contact information field.
- Save button.
- Success and error messages.

**Behavior:**

- Area admins can access their assigned area's instructions.
- System admins can select and manage any area.
- Existing instructions should load when the page opens.
- Saving should update the existing instructions or create a new record if none exists.
- Unauthorized users must not be able to access this screen.

### Notification History Screen

**Purpose:** Allow authorized admins to review emails sent for a reservation.

**Components:**

- Reservation ID.
- Recipient email.
- Notification type.
- Sent date.
- Empty state when no notifications exist.

**Behavior:**

- Display notification records for the selected reservation.
- Show the newest notifications first.
- Enforce area-level access restrictions.
- Display loading, success, empty, and error states where appropriate.

### Email Content Requirements

**Status Change Email:**

- Reservation ID.
- Requestor name.
- Reservation status.
- Assigned vehicle, if available.
- Reservation start and end date/time.
- Destination, if available.

**Day-Before Pickup and Return Email:**

- Requestor name.
- Reservation ID.
- Assigned vehicle information.
- Reservation start and end date/time.
- Pickup instructions.
- Return instructions.
- Area contact information, if available.

---

## 11. Data Model Requirements

### Existing Tables to Reuse

#### `email_notifications`

| Field | Type | Constraints |
|---|---|---|
| `notification_id` | Integer | PK |
| `reservation_id` | Integer | FK → reservations.reservation_id |
| `recipient_email` | VARCHAR | Required |
| `notification_type` | VARCHAR | Required |
| `sent_date` | DATETIME | Required |

Suggested notification types:

- `Status Change`
- `Pickup and Return Instructions`

#### `area_instructions`

| Field | Type | Constraints |
|---|---|---|
| `instruction_id` | Integer | PK |
| `area_id` | Integer | FK → areas.area_id |
| `pickup_instructions` | TEXT | Required |
| `return_instructions` | TEXT | Required |
| `contact_information` | TEXT | Optional |

### Relationships

- One reservation can have many email notification records.
- Each email notification belongs to one reservation.
- One area can have one area instruction record.
- Each area instruction record belongs to one area.
- A reservation's assigned vehicle identifies the area whose instructions should be used.

### Data Model Notes

- Reuse the existing `email_notifications` and `area_instructions` tables.
- Do not create separate tables for status emails and pickup instruction emails.
- Confirm whether `area_id` in `area_instructions` has a UNIQUE constraint. The intended design is one instruction record per area.
- Confirm whether `sent_date` is a DATETIME field in the existing database.
- The existing notification table does not include delivery status, retry count, or a unique event identifier. If reliable retry tracking or duplicate prevention requires additional fields, coordinate that schema change with the team before implementing it.
- The existing schema does not specify a notification scheduling or background-job table. Use the project's existing scheduler if available; otherwise coordinate the scheduling approach with the team.

---

## 12. Acceptance Criteria

### Status Change Notifications

```gherkin
Scenario: Send an email when reservation status changes
  Given a requestor has an existing reservation
  When an authorized user changes the reservation status
  Then the system sends an email to the requestor
  And the email includes the new reservation status
  And a notification record is saved
```

```gherkin
Scenario: Do not send an email when the status does not change
  Given a reservation has an existing status
  When the reservation is updated without changing its status
  Then no status-change email is sent
```

### Pickup and Return Instructions

```gherkin
Scenario: Send instructions one day before a reservation
  Given a reservation has an assigned vehicle
  And the assigned vehicle belongs to an area with saved instructions
  When the day-before notification is due
  Then the system sends pickup and return instructions to the requestor
  And the email includes the area's contact information when available
  And a notification record is saved
```

```gherkin
Scenario: Do not send instructions for a cancelled reservation
  Given a reservation has been cancelled
  When the day-before notification is due
  Then the system does not send the instructions email
```

```gherkin
Scenario: Prevent duplicate scheduled notifications
  Given a day-before notification has already been sent for a reservation
  When the scheduled job runs again
  Then the system does not send the same notification again
```

### Area Instructions

```gherkin
Scenario: Area admin updates instructions
  Given an area admin is authenticated
  And the admin manages Area 1
  When the admin updates Area 1's pickup and return instructions
  Then the system saves the updated instructions
```

```gherkin
Scenario: Area admin cannot update another area's instructions
  Given an area admin manages Area 1
  When the admin attempts to update Area 2's instructions
  Then the system returns a forbidden response
```

```gherkin
Scenario: System admin manages area instructions
  Given a system admin is authenticated
  When the admin updates instructions for any existing area
  Then the system saves the updated instructions
```

### Notification History

```gherkin
Scenario: View notification history
  Given an authorized admin has access to a reservation
  When the admin views its notification history
  Then the system displays the notification records for that reservation
```

```gherkin
Scenario: Prevent unauthorized notification history access
  Given an area admin does not manage the reservation's area
  When the admin requests the reservation's notification history
  Then the system returns a forbidden response
```

---

## 13. Test Coverage Map

| Requirement | Test | Expected Result |
|---|---|---|
| Status-change email | `backend/tests/notification.test.js` `it("Send an email when reservation status changes")` | Email is triggered when status changes. |
| No status change | `it("Do not send an email when the status does not change")` | No status email is triggered. |
| Correct email recipient | Same status-change test (`sentMail[0].to`) | Email goes to the requestor. |
| Correct email content | `it("includes required reservation details in the status email")` | Required reservation details appear in the email. |
| Day-before instructions | `it("Send instructions one day before a reservation")` | Email is sent one day before the reservation. |
| Cancelled reservation | `it("Do not send instructions for a cancelled reservation")` | No instructions email is sent. |
| Area instruction lookup | Day-before test includes area pickup/contact text | Correct area's instructions are retrieved. |
| Update instructions | `it("Area admin updates instructions")` plus `frontend/tests/AreaInstructions.test.js` | Instructions are saved successfully. |
| Area access restrictions | `it("Area admin cannot update another area's instructions")` | Area admins cannot manage another area's instructions. |
| System admin access | `it("System admin manages area instructions")` | System admin can manage all areas. |
| Notification history | `it("View notification history")` plus `frontend/tests/NotificationHistory.test.js` | Saved notifications are returned. |
| Duplicate prevention | `it("Prevent duplicate scheduled notifications")` | A previously sent notification is not sent again. |
| Email delivery failure | `it("handles email delivery failure without recording success")` | Failure is handled without falsely recording success. |
| Missing email address | `it("handles a missing requestor email address")` | System handles missing recipient information. |
| Missing instructions | `it("handles missing area instructions")` | System handles missing area instructions appropriately. |
| Unauthorized history | `it("Prevent unauthorized notification history access")` | Area admins cannot view another area's history. |

---

## 14. Agent Implementation Request

Implement **Feature 16 — Email Notifications and Pickup Instructions** in the existing OC Vehicle Scheduling System repository.

**Branch:** `feature/16-vehicle-email-notifications-and-pickup-instructions`

### Implementation Instructions

1. Inspect the existing project structure and shared reference files before making changes.
2. Review existing authentication, reservation status update, vehicle assignment, area, and email functionality.
3. Reuse existing models and services wherever possible.
4. Implement status-change email notifications.
5. Implement the scheduled day-before pickup and return instruction email.
6. Retrieve the correct area's instructions using the reservation's assigned vehicle.
7. Implement area instruction management for authorized area admins and system admins.
8. Implement notification history retrieval with area-level access restrictions.
9. Reuse the existing `email_notifications` and `area_instructions` tables.
10. Do not introduce new database tables or fields without confirming the need and coordinating with the team.
11. Prevent duplicate scheduled notifications.
12. Handle email delivery failures without incorrectly recording an unsuccessful email as sent.
13. Write backend tests for all acceptance scenarios.
14. Implement the frontend screens for area instruction management and notification history.
15. Add frontend tests for loading, saving, errors, empty states, and access restrictions.
16. Run the relevant backend and frontend test suites.
17. Update shared API, data model, and behavior references if implementation changes require it.

### Implementation Order

Follow the project's existing layer order:

1. Models and database relationships.
2. Backend services and email integration.
3. Backend routes and access control.
4. Backend tests.
5. Frontend screens and API integration.
6. Frontend tests.
7. Update shared references.

### Important Implementation Notes

- Use the existing email service if one is already configured.
- Do not hardcode email addresses or SMTP credentials.
- Use environment variables for email configuration.
- Do not send notification emails directly from frontend code.
- Trigger status notifications from the backend reservation status update process.
- Use a backend scheduler or scheduled job for day-before emails.
- Use the assigned vehicle's `area_id` to find the correct `area_instructions` record.
- Confirm the intended one-instruction-record-per-area relationship.
- Use the project's existing date/time conventions and timezone handling.
- If the project does not have a scheduler or email provider configured, document the missing dependency rather than pretending the feature is fully operational.
- Do not mark an email as successfully sent unless the email provider confirms successful sending.
- Ensure duplicate prevention works even if a scheduled job runs more than once.
- Coordinate any required schema changes before implementing them.

---

## 15. Definition of Done

- [ ] Status-change email notifications are implemented.
- [ ] Day-before pickup and return instruction emails are implemented.
- [ ] Correct area instructions are included in emails.
- [ ] Area admins can manage their area's instructions.
- [ ] System admins can manage all area instructions.
- [ ] Notification history can be viewed by authorized admins.
- [ ] Email notifications are recorded after successful sending.
- [ ] Duplicate scheduled notifications are prevented.
- [ ] Cancelled reservations do not receive day-before instructions.
- [ ] Email delivery failures are handled appropriately.
- [ ] Area-level access restrictions are enforced.
- [ ] Backend tests pass.
- [ ] Frontend tests pass.
- [ ] Shared API, data model, and behavior references are updated if needed.
- [ ] No unrelated features are changed.

---

## 16. Out of Scope

- User authentication and Google login (Feature 1).
- Creating or editing reservations.
- Vehicle availability and assignment.
- Vehicle checkout and return (Feature 12).
- Vehicle issue reporting (Feature 13).
- Vehicle maintenance requests (Feature 14).
- Vehicle mileage and service logs (Feature 15).
- Vehicle, driver, and destination management.
- Creating new reservation statuses.
- Email templates or notification preferences managed by individual users.
- SMS or text-message notifications.
- Sending reminders at multiple intervals.
- Tracking whether a user opened or read an email.
- Managing email provider accounts or infrastructure.
- Automatically changing reservation status based on email delivery.
- A complete notification retry dashboard or delivery analytics system.

---

**End of Feature 16 Specification**