# Personalized Invitations

## URL

Personalized invite links use:

`/{language}/invite/{token}`

Examples:
- `/vi/invite/{token}`
- `/en/invite/{token}`
- `/jp/invite/{token}`

## guest_invites

Important fields include:
- `token`
- `guest_name`
- `display_name`
- `companion_name`
- `phone`
- `event_choice`
- `max_guests`
- `side`
- `preferred_language`
- `sent_at`
- `opened_at`
- `last_opened_at`
- `open_count`

## Access flow

1. Public page reads the token.
2. `get_wedding_invite(token)` resolves an active invitation.
3. Guest name, phone, event and max guest count are prefilled.
4. Opening the invitation calls `mark_wedding_invite_opened(token)`.
5. If an RSVP already exists for the invite, `get_wedding_rsvp(token)` prefills the previous response.
6. Submission calls `submit_wedding_rsvp(...)`.
7. The database inserts on first response and updates the same row on later responses.

## RSVP source rules

- Personalized link → `response_source = 'invite'`
- Normal website → `response_source = 'public'`
- Admin-created flow → `response_source = 'admin'`

Do not infer invite ownership from guest name or phone number.

## Uniqueness

A partial unique index ensures only one RSVP row can exist for a non-null `invite_id`.
