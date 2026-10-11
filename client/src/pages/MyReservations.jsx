import { useEffect, useState } from "react";
import {
  cancelReservation,
  getReservations,
} from "../services/reservationService";
import "./MyReservations.css";

// The project does not have login or stored user identity yet.
const DEMO_USER_NAME = "Demo User";

const CANCELLABLE_STATUSES = new Set([
  "active",
  "pending",
  "confirmed",
  "reserved",
]);

function getFoodName(reservation) {
  return (
    reservation.foodName ||
    reservation.listing?.foodName ||
    reservation.food?.foodName ||
    "Shared food listing"
  );
}

function getFoodImage(reservation) {
  return (
    reservation.imageUrl ||
    reservation.image ||
    reservation.foodImage ||
    reservation.listing?.imageUrl ||
    reservation.listing?.image ||
    reservation.food?.imageUrl ||
    reservation.food?.image ||
    ""
  );
}

function formatDate(value, fallback = "Not provided") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatus(reservation) {
  return String(reservation.status || "Unknown").toLowerCase();
}

function canCancel(reservation) {
  return (
    reservation.id !== undefined &&
    reservation.id !== null &&
    CANCELLABLE_STATUSES.has(getStatus(reservation))
  );
}

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [cancellationError, setCancellationError] = useState("");

  async function loadReservations(isActive = () => true) {
    try {
      setIsLoading(true);
      setError("");

      const results = await getReservations(DEMO_USER_NAME);

      if (isActive()) {
        setReservations(results);
      }
    } catch (requestError) {
      if (isActive()) {
        setError(
          requestError.message ||
            "We couldn't load your reservations. Please try again."
        );
      }
    } finally {
      if (isActive()) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;

    loadReservations(() => isMounted);

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCancel(reservation) {
    if (!canCancel(reservation)) {
      return;
    }

    const foodName = getFoodName(reservation);
    const shouldCancel = window.confirm(
      `Cancel your reservation for ${foodName}?`
    );

    if (!shouldCancel) {
      return;
    }

    setCancellingId(reservation.id);
    setCancellationError("");

    try {
      await cancelReservation(reservation.id);
      await loadReservations();
    } catch (requestError) {
      setCancellationError(
        requestError.message ||
          "We couldn't cancel this reservation. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="reservations-page">
      <section className="reservations-header">
        <span className="reservations-eyebrow">YOUR KINDNESS JOURNEY</span>
        <h1>
          My <span>reservations.</span>
        </h1>
        <p>
          Keep track of the food you have reserved and the moments of
          goodness waiting to be collected.
        </p>
      </section>

      <section className="reservations-content" aria-live="polite">
        {isLoading ? (
          <div className="reservations-state" role="status">
            <span className="reservations-state-icon" aria-hidden="true">
              ◌
            </span>
            <h2>Finding your reservations...</h2>
            <p>Please wait while we load your reserved food.</p>
          </div>
        ) : error ? (
          <div className="reservations-state reservations-error" role="alert">
            <span className="reservations-state-icon" aria-hidden="true">
              !
            </span>
            <h2>We couldn't load your reservations</h2>
            <p>{error}</p>
            <button
              type="button"
              className="reservations-primary-button"
              onClick={() => loadReservations()}
            >
              Try again
            </button>
          </div>
        ) : reservations.length === 0 ? (
          <div className="reservations-state">
            <span className="reservations-state-icon" aria-hidden="true">
              ♡
            </span>
            <h2>No reservations yet</h2>
            <p>
              When you reserve shared food, it will appear here so you can
              keep track of your collection details.
            </p>
            <a href="/browse" className="reservations-primary-button">
              Explore available food
            </a>
          </div>
        ) : (
          <>
            {cancellationError && (
              <p className="reservations-action-error" role="alert">
                {cancellationError}
              </p>
            )}

            <div className="reservations-toolbar">
              <h2>Your reserved food</h2>
              <span>
                {reservations.length}{" "}
                {reservations.length === 1 ? "reservation" : "reservations"}
              </span>
            </div>

            <div className="reservations-list">
              {reservations.map((reservation) => {
                const status = getStatus(reservation);
                const reservationId = reservation.id;
                const isCancelling = cancellingId === reservationId;
                const image = getFoodImage(reservation);

                return (
                  <article
                    className="reservation-card"
                    key={reservationId ?? `${getFoodName(reservation)}-${reservation.quantity}`}
                  >
                    {image ? (
                      <img
                        className="reservation-image"
                        src={image}
                        alt=""
                      />
                    ) : (
                      <div
                        className="reservation-image reservation-image-placeholder"
                        aria-hidden="true"
                      >
                        🍃
                      </div>
                    )}

                    <div className="reservation-card-content">
                      <div className="reservation-card-heading">
                        <div>
                          <span className="reservation-category">
                            RESERVED FOOD
                          </span>
                          <h3>{getFoodName(reservation)}</h3>
                        </div>
                        <span
                          className={`reservation-status reservation-status-${status}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="reservation-details">
                        <p>
                          <span aria-hidden="true">🍱</span>
                          <span>
                            <strong>Quantity</strong>
                            {reservation.quantity ?? "Not provided"}
                          </span>
                        </p>
                        <p>
                          <span aria-hidden="true">📍</span>
                          <span>
                            <strong>Pickup location</strong>
                            {reservation.pickupLocation ||
                              reservation.listing?.pickupLocation ||
                              "Not provided"}
                          </span>
                        </p>
                        <p>
                          <span aria-hidden="true">🕒</span>
                          <span>
                            <strong>Collect by</strong>
                            {reservation.collectionDeadline ||
                              reservation.listing?.collectionDeadline ||
                              "Not provided"}
                          </span>
                        </p>
                        <p>
                          <span aria-hidden="true">📅</span>
                          <span>
                            <strong>Reserved on</strong>
                            {formatDate(
                              reservation.reservationDate ||
                                reservation.createdAt ||
                                reservation.created_at
                            )}
                          </span>
                        </p>
                      </div>

                      {canCancel(reservation) && (
                        <button
                          type="button"
                          className="reservation-cancel-button"
                          onClick={() => handleCancel(reservation)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? "Cancelling..." : "Cancel reservation"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
