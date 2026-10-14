import { useState } from "react";
import { createListing } from "../services/listingService";
import "./AddFood.css";

const categories = ["Meals", "Snacks", "Bakery", "Fruits", "Vegetables", "Other"];

const initialForm = {
  foodName: "",
  description: "",
  category: "Meals",
  quantity: "",
  pickupLocation: "",
  collectionDeadline: "",
  donorName: "",
};

function validateForm(values) {
  const errors = {};

  if (!values.foodName.trim()) {
    errors.foodName = "Food name is required.";
  }

  if (!values.category.trim()) {
    errors.category = "Please choose a category.";
  }

  if (!values.quantity) {
    errors.quantity = "Quantity is required.";
  } else if (!Number.isInteger(Number(values.quantity)) || Number(values.quantity) <= 0) {
    errors.quantity = "Quantity must be a positive whole number.";
  }

  if (!values.pickupLocation.trim()) {
    errors.pickupLocation = "Pickup location is required.";
  }

  if (!values.collectionDeadline) {
    errors.collectionDeadline = "Collection deadline is required.";
  } else {
    const deadline = new Date(values.collectionDeadline);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      errors.collectionDeadline = "Please choose a future date and time.";
    }
  }

  if (!values.donorName.trim()) {
    errors.donorName = "Donor name is required.";
  }

  return errors;
}

export default function AddFood() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));

    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setSuccessMessage("");
    setErrorMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        foodName: form.foodName.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        quantity: Number(form.quantity),
        pickupLocation: form.pickupLocation.trim(),
        collectionDeadline: form.collectionDeadline,
        donorName: form.donorName.trim(),
      };

      await createListing(payload);
      setSuccessMessage("Listing saved successfully.");
      setForm(initialForm);
      setErrors({});
    } catch (error) {
      setErrorMessage(error.message || "Could not save the listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="add-food-page">
      <h1 className="add-food-title">Add a surplus listing</h1>

      <form className="add-food-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="foodName">Food name *</label>
          <input
            id="foodName"
            name="foodName"
            type="text"
            value={form.foodName}
            onChange={handleChange}
            className={errors.foodName ? "input-error" : ""}
          />
          {errors.foodName && <p className="field-error">{errors.foodName}</p>}
        </div>

        <div className="field">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={errors.category ? "input-error" : ""}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>

        <div className="field full-width">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label htmlFor="quantity">Quantity *</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={handleChange}
            className={errors.quantity ? "input-error" : ""}
          />
          {errors.quantity && <p className="field-error">{errors.quantity}</p>}
        </div>

        <div className="field">
          <label htmlFor="donorName">Donor name *</label>
          <input
            id="donorName"
            name="donorName"
            type="text"
            value={form.donorName}
            onChange={handleChange}
            className={errors.donorName ? "input-error" : ""}
          />
          {errors.donorName && <p className="field-error">{errors.donorName}</p>}
        </div>

        <div className="field full-width">
          <label htmlFor="pickupLocation">Pickup location *</label>
          <input
            id="pickupLocation"
            name="pickupLocation"
            type="text"
            value={form.pickupLocation}
            onChange={handleChange}
            className={errors.pickupLocation ? "input-error" : ""}
          />
          {errors.pickupLocation && <p className="field-error">{errors.pickupLocation}</p>}
        </div>

        <div className="field full-width">
          <label htmlFor="collectionDeadline">Collection deadline *</label>
          <input
            id="collectionDeadline"
            name="collectionDeadline"
            type="datetime-local"
            value={form.collectionDeadline}
            onChange={handleChange}
            className={errors.collectionDeadline ? "input-error" : ""}
          />
          {errors.collectionDeadline && <p className="field-error">{errors.collectionDeadline}</p>}
        </div>

        <div className="form-actions">
          <div className="message-box" aria-live="polite">
            {successMessage && <p className="success">{successMessage}</p>}
            {errorMessage && <p className="error">{errorMessage}</p>}
          </div>

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Share food"}
          </button>
        </div>
      </form>
    </main>
  );
}
