# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on this Feature 16 branch.

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Status-change email | Sent to the requestor only when reservation status actually changes | US-16.1 |
| Unchanged status | No status-change email | US-16.1 |
| Day-before instructions | Sent when the job runs on the calendar day before `start_datetime` | US-16.2 |
| Cancelled reservations | No day-before email | FR 9 |
| Duplicate day-before | Existing `Pickup and Return Instructions` row blocks a second send | FR 15 |
| Record after success only | `email_notifications` row created after mailer succeeds | FR 13 |
| Area admin isolation | Area admins manage/view only their `area_id` | FR 10, FR 17 |
| System admin | Can manage all areas and run the day-before job | FR 11 |
| Missing SMTP | Mailer fails; success is not recorded | Assumptions / agent notes |
