import { useEffect, useState } from "react";
import { getListingById } from "../services/listingService";
import { createReservation } from "../services/reservationService";
import "./FoodDetails.css";

const DEMO_USER_NAME = "Demo User";

const sampleFoods = [
  {
    id: 1,
    foodName: "Fresh Vegetable Sandwiches",
    description:
      "Freshly prepared vegetable sandwiches, perfect for a quick and filling meal.",
    category: "Prepared Meals",
    quantity: 8,
    remainingQuantity: 8,
    pickupLocation: "Andheri, Mumbai",
    collectionDeadline: "Today, 7:00 PM",
    donorName: "Green Kitchen",
    status: "Available",
  },
  {
    id: 2,
    foodName: "Seasonal Fruit Box",
    description:
      "A selection of fresh seasonal fruits, packed and ready to be shared.",
    category: "Fruits",
    quantity: 5,
    remainingQuantity: 5,
    pickupLocation: "Bandra, Mumbai",
    collectionDeadline: "Today, 6:30 PM",
    donorName: "Fresh Basket",
    status: "Available",
  },
  {
    id: 3,
    foodName: "Homemade Chapatis",
    description:
      "Soft, homemade chapatis prepared fresh and available for collection.",
    category: "Bakery & Breads",
    quantity: 12,
    remainingQuantity: 12,
    pickupLocation: "Dadar, Mumbai",
    collectionDeadline: "Today, 8:00 PM",
    donorName: "A Kind Neighbour",
    status: "Available",
  },
  {
    id: 4,
    foodName: "Cooked Rice",
    description:
      "Freshly cooked rice stored properly and available for timely collection.",
    category: "Prepared Meals",
    quantity: 6,
    remainingQuantity: 6,
    pickupLocation: "Andheri, Mumbai",
    collectionDeadline: "Today, 7:30 PM",
    donorName: "Community Kitchen",
    status: "Available",
  },
  {
    id: 5,
    foodName: "Fresh Bread Loaves",
    description:
      "Fresh bread loaves available to anyone who can collect them before the deadline.",
    category: "Bakery & Breads",
    quantity: 4,
    remainingQuantity: 4,
    pickupLocation: "Juhu, Mumbai",
    collectionDeadline: "Today, 6:00 PM",
    donorName: "Daily Bakery",
    status: "Available",
  },
  {
    id: 6,
    foodName: "Fresh Bananas",
    description:
      "Fresh bananas ready to be shared. Please collect them before the listed deadline.",
    category: "Fruits",
    quantity: 10,
    remainingQuantity: 10,
    pickupLocation: "Vile Parle, Mumbai",
    collectionDeadline: "Today, 7:00 PM",
    donorName: "Fruit Corner",
    status: "Available",
  },
];

export default function FoodDetails({ foodId }) {
  const [food, setFood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [error, setError] = useState("");
  const [reservationQuantity, setReservationQuantity] = useState("1");
  const [isReserving, setIsReserving] = useState(false);
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchFood() {
      setIsLoading(true);
      setError("");
      setFood(null);
      setUsingSampleData(false);

      try {
        const listing = await getListingById(foodId);

        if (isMounted) {
          setFood(listing);
          setReservationQuantity("1");
          setReservationMessage("");
          setReservationError("");
        }
      } catch (err) {
        const sampleFood = sampleFoods.find(
          (item) => String(item.id) === String(foodId)
        );

        if (isMounted) {
          if (sampleFood) {
            setFood(sampleFood);
            setUsingSampleData(true);
            setReservationQuantity("1");
            setReservationMessage("");
            setReservationError("");
          } else {
            setError(
              "We couldn't load this listing from the backend. Please try again when the service is available."
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (foodId === undefined || foodId === null || foodId === "") {
      setError("A valid food listing ID is required.");
      setIsLoading(false);
    } else {
      fetchFood();
    }

    return () => {
      isMounted = false;
    };
  }, [foodId]);

  if (isLoading) {
    return (
      <main className="food-details-page">
        <div className="food-not-found" role="status">
          <h1>Finding your food listing...</h1>
          <p>Please wait while we load the details.</p>
        </div>
      </main>
    );
  }

  if (error || !food) {
    return (
      <main className="food-details-page">
        <div className="food-not-found">
          <h1>Food listing unavailable</h1>
          <p>{error || "We couldn't find this listing."}</p>
          <a href="/browse" className="details-back-button">
            ← Back to Browse Food
          </a>
        </div>
      </main>
    );
  }

  const availableQuantity = food.remainingQuantity ?? food.quantity ?? 0;

  const isAvailable =
    Number(availableQuantity) > 0 &&
    !["Unavailable", "Collected", "Reserved"].includes(food.status);
  const numericAvailableQuantity = Number(availableQuantity);
  const numericReservationQuantity = Number(reservationQuantity);
  const isReservationQuantityValid =
    Number.isInteger(numericReservationQuantity) &&
    numericReservationQuantity > 0 &&
    numericReservationQuantity <= numericAvailableQuantity;

  async function handleReservationSubmit(event) {
    event.preventDefault();
    setReservationMessage("");
    setReservationError("");

    if (usingSampleData) {
      setReservationError(
        "Reservations are unavailable while showing sample listing details."
      );
      return;
    }

    if (!isAvailable) {
      setReservationError("This listing is no longer available to reserve.");
      return;
    }

    if (!isReservationQuantityValid) {
      setReservationError(
        `Please enter a whole number between 1 and ${numericAvailableQuantity}.`
      );
      return;
    }

    setIsReserving(true);

    try {
      await createReservation({
        listingId: food.id,
        userName: DEMO_USER_NAME,
        quantity: numericReservationQuantity,
      });

      setFood((currentFood) => ({
        ...currentFood,
        remainingQuantity:
          numericAvailableQuantity - numericReservationQuantity,
      }));
      setReservationQuantity("1");
      setReservationMessage(
        "Reservation created successfully. Please collect it before the listed deadline."
      );
    } catch (requestError) {
      setReservationError(
        requestError.message ||
          "We couldn't create this reservation. The available quantity may have changed."
      );
    } finally {
      setIsReserving(false);
    }
  }

  return (
    <main className="food-details-page">
      <div className="food-details-container">
        <a href="/browse" className="details-back-link">
          ← Back to Browse Food
        </a>

        <section className="food-details-card">
          <div className="food-details-banner">
            <span className="details-category">{food.category}</span>

            <span
              className={`details-status ${
                isAvailable
                  ? "details-status-available"
                  : "details-status-unavailable"
              }`}
            >
              {isAvailable ? "Available to collect" : "Currently unavailable"}
            </span>

            <div className="details-food-illustration" aria-hidden="true">
              🍃
            </div>

            <p className="details-banner-caption">
              Goodness is better when shared.
            </p>
          </div>

          <div className="food-details-content">
            <span className="details-eyebrow">SHARED WITH KINDNESS</span>

            <h1>{food.foodName}</h1>

            <p className="details-description">
              {food.description || "No description provided."}
            </p>

            <div className="details-info-grid">
              <div className="details-info-item">
                <span className="details-info-icon">🍱</span>
                <div>
                  <span className="details-info-label">
                    Available quantity
                  </span>
                  <strong>{availableQuantity} portions/items</strong>
                </div>
              </div>

              <div className="details-info-item">
                <span className="details-info-icon">📍</span>
                <div>
                  <span className="details-info-label">Pickup location</span>
                  <strong>{food.pickupLocation || "Not specified"}</strong>
                </div>
              </div>

              <div className="details-info-item">
                <span className="details-info-icon">🕒</span>
                <div>
                  <span className="details-info-label">Collect before</span>
                  <strong>
                    {food.collectionDeadline || "Not specified"}
                  </strong>
                </div>
              </div>

              <div className="details-info-item">
                <span className="details-info-icon">💚</span>
                <div>
                  <span className="details-info-label">Shared by</span>
                  <strong>{food.donorName || "Community donor"}</strong>
                </div>
              </div>
            </div>

            <div className="details-kindness-note">
              <span>🌱</span>
              <p>
                Every meal shared is a small step towards reducing food waste
                and helping someone in our community.
              </p>
            </div>

            {usingSampleData && (
              <p className="sample-data-notice" role="status">
                Showing sample details while the backend is unavailable.
              </p>
            )}

            <div className="details-actions">
              <a href="/browse" className="details-back-button">
                Explore more food
              </a>

              <form
                className="details-reservation-form"
                onSubmit={handleReservationSubmit}
              >
                <label htmlFor="reservation-quantity">
                  Quantity to reserve
                </label>
                <span className="details-available-quantity">
                  {isAvailable
                    ? `${numericAvailableQuantity} available`
                    : "No quantity available"}
                </span>
                <div className="details-reservation-controls">
                  <input
                    id="reservation-quantity"
                    type="number"
                    min="1"
                    max={numericAvailableQuantity > 0 ? numericAvailableQuantity : undefined}
                    step="1"
                    value={reservationQuantity}
                    onChange={(event) => {
                      setReservationQuantity(event.target.value);
                      setReservationMessage("");
                      setReservationError("");
                    }}
                    disabled={!isAvailable || usingSampleData || isReserving}
                  />
                  <button
                    type="submit"
                    className="details-reserve-button"
                    disabled={
                      !isAvailable ||
                      usingSampleData ||
                      isReserving ||
                      !isReservationQuantityValid
                    }
                  >
                    {isReserving
                      ? "Reserving..."
                      : isAvailable
                        ? "Reserve Food"
                        : "Unavailable"}
                  </button>
                </div>
              </form>
            </div>

            {reservationMessage && (
              <p className="details-reservation-message" role="status">
                {reservationMessage}
              </p>
            )}

            {reservationError && (
              <p className="details-reservation-error" role="alert">
                {reservationError}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}