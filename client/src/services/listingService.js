import { apiRequest } from "./api";

/**
 * Fetch all food listings.
 * Expected response: { listings: [...] }
 */
export async function getListings() {
  const data = await apiRequest("/listings");

  // Support a direct array response as well.
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.listings)) {
    return data.listings;
  }

  throw new Error("Invalid response received while fetching food listings.");
}

/**
 * Fetch a single food listing by ID.
 * Expected response: { listing: {...} }
 */
export async function getListingById(id) {
  if (id === undefined || id === null || id === "") {
    throw new Error("A valid food listing ID is required.");
  }

  const data = await apiRequest(
    `/listings/${encodeURIComponent(id)}`
  );

  if (data && data.listing && typeof data.listing === "object") {
    return data.listing;
  }

  // Also support an API returning the listing directly.
  if (data && data.id !== undefined) {
    return data;
  }

  throw new Error("Invalid response received while fetching the food listing.");
}