# Admin

Admin entry:

`/admin`

## RSVP

The RSVP table supports:
- Search
- Attendance filter
- Event filter
- Source filter
- CSV export
- Edit modal

Source badges:
- **Được mời** → invite link
- **Khách tự nhập** → public website
- **Admin nhập** → admin-created response

Admin may edit:
- Guest name
- Phone
- Attendance
- Guest count
- Event
- Message

System metadata such as RSVP ID and invite ID are not edited from the modal.

When attendance is changed to `no`, guest count is stored as `0`.

## Guest invites

Guest management includes:
- Create/edit invite
- Personalized display name
- Companion
- Side/group
- Preferred language
- Event
- Max guest count
- Enable/disable link
- Mark sent
- Open tracking
- CSV import/export

## Security

Admin writes are limited by Supabase authenticated policies to the configured admin account.
