import { apiRequest } from "./api";

/**
 * Fetch all food listings.
 * Expected response: { listings: [...] }
 */
export async function getListings() {
  const data = await apiRequest("/listings");

  if (data && data.success === true && Array.isArray(data.data)) {
    return data.data;
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

  if (data && data.success === true && data.data && typeof data.data === "object") {
    return data.data;
  }

  throw new Error("Invalid response received while fetching the food listing.");
}

export async function createListing(listing) {
  if (!listing || typeof listing !== "object") {
    throw new Error("A valid food listing is required.");
  }

  const data = await apiRequest("/listings", {
    method: "POST",
    body: JSON.stringify(listing),
  });

  if (data && data.success === true && data.data && typeof data.data === "object") {
    return data.data;
  }

  throw new Error("Invalid response received while creating the food listing.");
}