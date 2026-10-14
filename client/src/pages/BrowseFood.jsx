import { useEffect, useMemo, useState } from "react";
import FoodCard from "../components/FoodCard";
import { getListings } from "../services/listingService";
import "./BrowseFood.css";

const categories = ["All", "Meals", "Snacks", "Bakery", "Fruits", "Vegetables", "Other"];

export default function BrowseFood() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchFoods() {
      try {
        setIsLoading(true);
        setError("");

        const listings = await getListings();

        if (isMounted) {
          setFoods(listings);
        }
      } catch (error) {
        if (isMounted) {
          setFoods([]);
          setError(error.message || "Could not load listings from the backend.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchFoods();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFoods = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return foods.filter((food) => {
      const matchesSearch = [
        food.foodName,
        food.description,
        food.category,
        food.pickupLocation,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedSearch)
      );

      const availableQuantity =
        food.remainingQuantity ?? food.quantity ?? 0;

      const matchesCategory =
        selectedCategory === "All" ||
        food.category === selectedCategory;

      const isAvailable =
        Number(availableQuantity) > 0 &&
        !["Unavailable", "Collected", "Reserved"].includes(food.status) &&
        !Number.isNaN(new Date(food.collectionDeadline).getTime()) &&
        new Date(food.collectionDeadline) > new Date();

      return matchesSearch && matchesCategory && isAvailable;
    });
  }, [foods, searchTerm, selectedCategory]);

  function clearFilters() {
    setSearchTerm("");
    setSelectedCategory("All");
  }

  return (
    <main className="browse-page">
      <section className="browse-header">
        <span className="browse-eyebrow">SHARED WITH KINDNESS</span>

        <h1>
          Find good food. <span>Pass goodness on.</span>
        </h1>

        <p>
          Explore food shared by your community. A little less waste
          can mean a little more good for someone else.
        </p>
      </section>

      <section className="browse-content">
        <div className="browse-toolbar">
          <div className="browse-search">
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              placeholder="Search food, category or location..."
              aria-label="Search food listings"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <span className="browse-result-count" aria-live="polite">
            {isLoading
              ? "Loading listings..."
              : `${filteredFoods.length} ${
                  filteredFoods.length === 1 ? "listing" : "listings"
                } available`}
          </span>
        </div>

        <div className="category-filters" aria-label="Filter by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-filter ${
                selectedCategory === category ? "active" : ""
              }`}
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="browse-empty-state" role="status">
            <h2>Finding shared food...</h2>
            <p>Please wait while we load available listings.</p>
          </div>
        ) : error ? (
          <div className="browse-empty-state" role="alert">
            <h2>Unable to load listings</h2>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : filteredFoods.length > 0 ? (
          <div className="food-grid">
            {filteredFoods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        ) : (
          <div className="browse-empty-state">
            <span aria-hidden="true">♡</span>

            <h2>No food found just yet</h2>

            <p>
              {foods.length === 0
                ? "There are no food listings to display right now. Please check back later."
                : "Try a different search or choose another category to explore available listings."}
            </p>

            {(searchTerm || selectedCategory !== "All") && (
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}