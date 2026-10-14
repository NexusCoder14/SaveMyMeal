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
  collectionDate: "",
  collectionTime: "",
  donorName: "",
};

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateLimits() {
  const today = new Date();
  const maximum = new Date(today);
  maximum.setFullYear(maximum.getFullYear() + 1);

  return {
    minimum: formatDateInput(today),
    maximum: formatDateInput(maximum),
  };
}

function isValidCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    year >= 1000 &&
    year <= 9999 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidClockTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function validateForm(values) {
  const errors = {};
  const { minimum, maximum } = getDateLimits();

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

  if (!values.collectionDate) {
    errors.collectionDate = "Collection date is required.";
  } else if (
    !isValidCalendarDate(values.collectionDate) ||
    values.collectionDate < minimum ||
    values.collectionDate > maximum
  ) {
    errors.collectionDate =
      "Choose a collection date between today and one year from today.";
  }

  if (!values.collectionTime) {
    errors.collectionTime = "Collection time is required.";
  } else if (!isValidClockTime(values.collectionTime)) {
    errors.collectionTime = "Choose a valid collection time.";
  }

  if (
    !errors.collectionDate &&
    !errors.collectionTime &&
    new Date(`${values.collectionDate}T${values.collectionTime}`) <= new Date()
  ) {
    errors.collectionTime =
      "Choose a collection deadline later than the current time.";
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
    const nextForm = {
      ...form,
      [name]: value,
    };
    const nextDeadlineErrors =
      name === "collectionDate" || name === "collectionTime"
        ? validateForm(nextForm)
        : {};

    setForm(nextForm);

    setErrors((current) => ({
      ...current,
      [name]: "",
      ...(name === "collectionDate" || name === "collectionTime"
        ? {
            collectionDate: nextDeadlineErrors.collectionDate || "",
            collectionTime: nextDeadlineErrors.collectionTime || "",
          }
        : {}),
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
        collectionDeadline: `${form.collectionDate}T${form.collectionTime}`,
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
          <label htmlFor="collectionDate">Collection date *</label>
          <input
            id="collectionDate"
            name="collectionDate"
            type="date"
            min={getDateLimits().minimum}
            max={getDateLimits().maximum}
            value={form.collectionDate}
            onChange={handleChange}
            className={errors.collectionDate ? "input-error" : ""}
          />
          {errors.collectionDate && <p className="field-error">{errors.collectionDate}</p>}
        </div>

        <div className="field full-width">
          <label htmlFor="collectionTime">Collection time *</label>
          <input
            id="collectionTime"
            name="collectionTime"
            type="time"
            value={form.collectionTime}
            onChange={handleChange}
            className={errors.collectionTime ? "input-error" : ""}
          />
          {errors.collectionTime && <p className="field-error">{errors.collectionTime}</p>}
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
