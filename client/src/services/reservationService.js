import { apiRequest } from "./api";

function validateUserName(userName) {
  if (typeof userName !== "string" || userName.trim() === "") {
    throw new Error("A valid user name is required.");
  }
}

function validateListingId(listingId) {
  if (
    (typeof listingId !== "string" && typeof listingId !== "number") ||
    String(listingId).trim() === ""
  ) {
    throw new Error("A valid food listing ID is required.");
  }
}

function validateReservationId(reservationId) {
  if (
    (typeof reservationId !== "string" && typeof reservationId !== "number") ||
    String(reservationId).trim() === ""
  ) {
    throw new Error("A valid reservation ID is required.");
  }
}

function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Reservation quantity must be a positive whole number.");
  }
}

/**
 * Fetch reservations belonging to a demo user.
 * Expected response: { reservations: [...] }
 */
export async function getReservations(userName) {
  validateUserName(userName);

  const data = await apiRequest(
    `/reservations?userName=${encodeURIComponent(userName.trim())}`
  );

  if (data && Array.isArray(data.reservations)) {
    return data.reservations;
  }

  throw new Error(
    "Invalid response received while fetching reservations."
  );
}

/**
 * Create a reservation for a food listing.
 * Expected response: { reservation: {...} }
 */
export async function createReservation({
  listingId,
  userName,
  quantity,
} = {}) {
  validateListingId(listingId);
  validateUserName(userName);
  validateQuantity(quantity);

  const data = await apiRequest("/reservations", {
    method: "POST",
    body: JSON.stringify({
      listingId,
      userName: userName.trim(),
      quantity,
    }),
  });

  if (data && data.reservation && typeof data.reservation === "object") {
    return data.reservation;
  }

  throw new Error(
    "Invalid response received while creating the reservation."
  );
}

/**
 * Cancel an existing reservation.
 * Expected response: { reservation: {...} }
 */
export async function cancelReservation(reservationId) {
  validateReservationId(reservationId);

  const data = await apiRequest(
    `/reservations/${encodeURIComponent(reservationId)}/cancel`,
    { method: "PATCH" }
  );

  if (data && data.reservation && typeof data.reservation === "object") {
    return data.reservation;
  }

  throw new Error(
    "Invalid response received while cancelling the reservation."
  );
}
