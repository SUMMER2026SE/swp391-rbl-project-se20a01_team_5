# Admin Use Cases 39-46

This note summarizes the admin features implemented for use cases 39-46.

## Scope

- UC39: Lock and unlock user accounts.
- UC40: Review, classify, and resolve complaints.
- UC41: View reported violations and processing status.
- UC42: View account details.
- UC43: Search accounts by name, email, phone number, and role.
- UC44: View system dashboard statistics.
- UC45: Send system-wide notifications.
- UC46: Configure and adjust route fares.

## Runtime Notes

- Backend admin APIs use the shared PostgreSQL schema.
- Frontend admin pages consume the real API when mock mode is disabled.
- The admin users page aligns role badges with fixed table columns so role labels remain readable.

## Local Test Account

Seeded admin account:

```text
Email: admin.verify@unibus.local
Password: Password123!
```
