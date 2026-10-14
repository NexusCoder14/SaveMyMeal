# SaveMyMeal API

The authoritative backend is `backend/`. All successful and failed JSON
responses use this envelope:

```json
{ "success": true, "message": "Human-readable message", "data": {} }
```

Errors use `success: false` and a useful `message`. The API base path is
`http://localhost:3001/api`.

## Listings

- `GET /listings` returns `data` as an array. Optional `search`, `category`, and
  `status` query parameters are supported.
- `GET /listings/:id` returns one listing in `data`.
- `POST /listings` accepts `foodName`, `description`, `category`, `quantity`,
  `pickupLocation`, `collectionDeadline`, and `donorName`. Quantity must be a
  positive integer. `collectionDeadline` is stored as a local
  `YYYY-MM-DDTHH:mm` text value and must be a real date/time later than the
  server's current local time and no more than one year in the future.
- `PATCH /listings/:id` updates listing details or one of
  `Available`, `Partially Reserved`, `Reserved`, `Collected`, `Unavailable`.
- `DELETE /listings/:id` deletes only listings with no reservation history.

## Reservations

- `GET /reservations?userName=Demo%20User` returns joined reservation/listing
  records in `data`.
- `POST /reservations` accepts `{ listingId, userName, quantity }`. The
  operation is transactional and rejects unavailable, expired, invalid, or
  over-reserved listings.
- `PATCH /reservations/:id` accepts `{ "status": "Cancelled" }` or
  `{ "status": "Collected" }`. Cancelling an active reservation restores its
  quantity exactly once.

Reservation statuses are `Active`, `Cancelled`, and `Collected`. Listing
statuses are `Available`, `Partially Reserved`, `Reserved`, `Collected`, and
`Unavailable`.
