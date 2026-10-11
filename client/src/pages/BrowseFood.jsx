import { useEffect, useMemo, useState } from "react";
import FoodCard from "../components/FoodCard";
import { getListings } from "../services/listingService";
import "./BrowseFood.css";

const sampleFoods = [
  {
    id: 1,
    foodName: "Fresh Vegetable Sandwiches",
    description:
      "Freshly prepared vegetable sandwiches, perfect for a quick and wholesome meal.",
    category: "Prepared Meals",
    quantity: 8,
    remainingQuantity: 8,
    pickupLocation: "Andheri West, Mumbai",
    collectionDeadline: "Today, 7:00 PM",
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
    pickupLocation: "Vile Parle, Mumbai",
    collectionDeadline: "Today, 6:00 PM",
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
    pickupLocation: "Santacruz, Mumbai",
    collectionDeadline: "Today, 8:00 PM",
    status: "Available",
  },
  {
    id: 4,
    foodName: "Cooked Rice",
    description:
      "Freshly cooked rice that can accompany a meal and help prevent food waste.",
    category: "Prepared Meals",
    quantity: 6,
    remainingQuantity: 6,
    pickupLocation: "Bandra East, Mumbai",
    collectionDeadline: "Today, 7:30 PM",
    status: "Available",
  },
  {
    id: 5,
    foodName: "Fresh Bread Loaves",
    description:
      "Extra bread loaves, stored properly and ready for someone to enjoy.",
    category: "Bakery & Breads",
    quantity: 4,
    remainingQuantity: 4,
    pickupLocation: "Jogeshwari, Mumbai",
    collectionDeadline: "Today, 5:30 PM",
    status: "Available",
  },
  {
    id: 6,
    foodName: "Fresh Bananas",
    description:
      "A bunch of ripe bananas available for collection and sharing.",
    category: "Fruits",
    quantity: 10,
    remainingQuantity: 10,
    pickupLocation: "Goregaon, Mumbai",
    collectionDeadline: "Today, 6:30 PM",
    status: "Available",
  },
];

const categories = [
  "All",
  "Prepared Meals",
  "Fruits",
  "Bakery & Breads",
];

export default function BrowseFood() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchFoods() {
      try {
        setIsLoading(true);

        const listings = await getListings();

        if (isMounted) {
          setFoods(listings);
          setUsingSampleData(false);
        }
      } catch (error) {
        console.warn(
          "Backend unavailable. Using sample food listings for development.",
          error
        );

        if (isMounted) {
          setFoods(sampleFoods);
          setUsingSampleData(true);
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
        !["Unavailable", "Collected", "Reserved"].includes(
          food.status
        );

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

        {usingSampleData && !isLoading && (
          <p className="sample-data-notice" role="status">
            Showing sample listings while the backend is unavailable.
          </p>
        )}

        {isLoading ? (
          <div className="browse-empty-state" role="status">
            <h2>Finding shared food...</h2>
            <p>Please wait while we load available listings.</p>
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