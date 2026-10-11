import "./FoodCard.css";
export default function FoodCard({ food }) {
  if (!food) {
    return null;
  }

  const {
    id,
    foodName,
    description,
    category,
    quantity,
    remainingQuantity,
    pickupLocation,
    collectionDeadline,
  } = food;

  const availableQuantity = remainingQuantity ?? quantity;

  const isAvailable =
    availableQuantity > 0 &&
    food.status !== "Unavailable" &&
    food.status !== "Collected" &&
    food.status !== "Reserved";

  return (
    <article className="food-card">
      <div className="food-card-top">
        <span className="food-category">{category}</span>

        <span
          className={`food-status ${
            isAvailable ? "status-available" : "status-unavailable"
          }`}
        >
          {isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      <div className="food-card-content">
        <h3>{foodName}</h3>

        <p className="food-description">
          {description || "No description provided."}
        </p>

        <div className="food-card-details">
          <p>
            <span aria-hidden="true">🍱</span>
            <span>
              <strong>Quantity</strong>
              {availableQuantity} available
            </span>
          </p>

          <p>
            <span aria-hidden="true">📍</span>
            <span>
              <strong>Pickup location</strong>
              {pickupLocation}
            </span>
          </p>

          <p>
            <span aria-hidden="true">🕒</span>
            <span>
              <strong>Collect by</strong>
              {collectionDeadline}
            </span>
          </p>
        </div>

        <a
          className="food-card-button"
          href={`/food/${id}`}
          aria-label={`View details for ${foodName}`}
        >
          View Details <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}