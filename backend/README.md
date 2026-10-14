# SaveMyMeal — Module D: Standalone Backend & Database Foundation

Backend REST API and SQLite database engine for **SaveMyMeal**, a surplus food rescue platform developed by four college teammates.

This module provides the independent backend foundation for:
- **Module A**: Browse Food (Search, category filters, listing details)
- **Module B**: Add Food (Food submission, validation, status management)
- **Module C**: Reservations (Quantity selection, reserve, view user reservations, cancel)

---

## Architecture & Technology Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js
- **Database**: SQLite3 (`backend/data/savemymeal.db`, excluded from Git)
- **CORS**: Configured for local development origins and the deployed frontend
  (`https://savemymeal-frontend.onrender.com`); requests without an `Origin`
  header are also supported for curl and server-to-server tools
- **Port**: `http://localhost:3001` (by default)

---

## Directory Structure

```
backend/
├── server.js          # Express app entry point & CORS configuration
├── database.js        # SQLite schema initialization, FK enforcement & demo seed
├── listings.js        # REST router for food listings (Modules A & B)
├── reservations.js    # REST router for food reservations & transactions (Module C)
├── package.json       # Backend-specific npm manifest
├── .gitignore         # Excludes node_modules and local .db files
├── README.md          # Complete API documentation & frontend fetch examples
├── data/              # Stores local savemymeal.db (generated on start)
└── tests/
    └── api.test.js    # Automated HTTP integration test suite
```

---

## Quick Start Guide

### 1. Install Backend Dependencies
Run from the `backend/` directory:
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
# Production / Normal start (http://localhost:3001)
npm start

# Or with live reload
npm run dev
```

### 3. Run Automated Tests
```bash
npm test
```
Executes 15 comprehensive tests covering listing creation, filtering, quantity deduction, over-reservation checks, cancellation restock, and foreign key integrity.

---

## Database Schema (SQLite)

Foreign keys are explicitly enabled (`PRAGMA foreign_keys = ON;`).

### `listings` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique listing ID |
| `foodName` | TEXT | NOT NULL | Title/name of the food item |
| `description` | TEXT | | Details, ingredients, notes |
| `category` | TEXT | NOT NULL | Category (e.g. Snacks, Bakery, Meals, Fruits) |
| `quantity` | INTEGER | NOT NULL, CHECK(quantity > 0) | Initial quantity shared |
| `remainingQuantity` | INTEGER | NOT NULL, CHECK(remainingQuantity >= 0) | Current available stock |
| `pickupLocation` | TEXT | NOT NULL | Pickup point (e.g. College Canteen) |
| `collectionDeadline`| TEXT | NOT NULL | ISO date/time string |
| `donorName` | TEXT | NOT NULL | Name of student/canteen donor |
| `status` | TEXT | NOT NULL | `Available`, `Partially Reserved`, `Reserved`, `Collected`, `Unavailable` |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### `reservations` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique reservation ID |
| `listingId` | INTEGER | NOT NULL, FK -> listings(id) | Reference to listing (RESTRICT delete) |
| `userName` | TEXT | NOT NULL | Student making reservation |
| `quantity` | INTEGER | NOT NULL, CHECK(quantity > 0) | Quantity reserved |
| `status` | TEXT | NOT NULL | `Active`, `Cancelled`, `Collected` |
| `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp |

---

## REST API Specification

All responses use a consistent JSON structure:
- **Success**: `{ "success": true, "message": "...", "data": ... }`
- **Error**: `{ "success": false, "message": "..." }`

### Endpoints Overview

| Method | Endpoint | Description | Frontend Module |
|---|---|---|---|
| `GET` | `/api/health` | Health & uptime check | System |
| `GET` | `/api/listings` | Browse and filter listings | Module A |
| `GET` | `/api/listings/:id` | Get listing details | Module A |
| `POST` | `/api/listings` | Create new food listing | Module B |
| `PATCH`| `/api/listings/:id` | Update listing or status | Module B |
| `DELETE`| `/api/listings/:id` | Remove unreserved listing | Module B |
| `GET` | `/api/reservations` | View user reservations | Module C |
| `POST` | `/api/reservations` | Reserve food | Module C |
| `PATCH`| `/api/reservations/:id` | Cancel or update reservation | Module C |

---

### Detailed Endpoint Contracts

#### 1. Browse Listings (`GET /api/listings`)
- **Query Parameters**:
  - `search` (optional): Matches `foodName`, `description`, or `pickupLocation`
  - `category` (optional): Matches category (e.g. `Snacks`)
  - `status` (optional): Matches status (`Available`, `Partially Reserved`, etc.)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Listings retrieved successfully",
  "data": [
    {
      "id": 1,
      "foodName": "Fresh Vegetable Sandwiches",
      "description": "Grilled veg sandwiches with green chutney and cheese.",
      "category": "Snacks",
      "quantity": 10,
      "remainingQuantity": 10,
      "pickupLocation": "College Canteen Counter 2",
      "collectionDeadline": "2026-10-12T18:00:00",
      "donorName": "Meet",
      "status": "Available",
      "createdAt": "2026-10-11 11:55:00"
    }
  ]
}
```

#### 2. Create Listing (`POST /api/listings`)
- **Request Body**:
```json
{
  "foodName": "Vegetable Sandwiches",
  "description": "Fresh vegetable sandwiches",
  "category": "Snacks",
  "quantity": 10,
  "pickupLocation": "College Canteen",
  "collectionDeadline": "2026-10-12T18:00:00",
  "donorName": "Meet"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "id": 5,
    "foodName": "Vegetable Sandwiches",
    "description": "Fresh vegetable sandwiches",
    "category": "Snacks",
    "quantity": 10,
    "remainingQuantity": 10,
    "pickupLocation": "College Canteen",
    "collectionDeadline": "2026-10-12T18:00:00",
    "donorName": "Meet",
    "status": "Available"
  }
}
```

#### 3. Reserve Food (`POST /api/reservations`)
- **Request Body**:
```json
{
  "listingId": 1,
  "userName": "Rahul",
  "quantity": 2
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": 1,
    "listingId": 1,
    "foodName": "Fresh Vegetable Sandwiches",
    "pickupLocation": "College Canteen Counter 2",
    "collectionDeadline": "2026-10-12T18:00:00",
    "userName": "Rahul",
    "quantity": 2,
    "remainingQuantity": 8,
    "listingStatus": "Partially Reserved",
    "status": "Active"
  }
}
```
- **Response `409 Conflict` (Insufficient Quantity)**:
```json
{
  "success": false,
  "message": "Insufficient quantity available. Requested 15, but only 8 available."
}
```

#### 4. View Reservations (`GET /api/reservations`)
- **Query Parameters**:
  - `userName` (optional): Filter reservations for a student (e.g. `?userName=Rahul`)
  - `status` (optional): Filter by `Active`, `Cancelled`, or `Collected`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Reservations retrieved successfully",
  "data": [
    {
      "id": 1,
      "listingId": 1,
      "userName": "Rahul",
      "quantity": 2,
      "status": "Active",
      "createdAt": "2026-10-11 12:00:00",
      "foodName": "Fresh Vegetable Sandwiches",
      "category": "Snacks",
      "pickupLocation": "College Canteen Counter 2",
      "collectionDeadline": "2026-10-12T18:00:00",
      "donorName": "Meet",
      "listingStatus": "Partially Reserved"
    }
  ]
}
```

#### 5. Cancel Reservation (`PATCH /api/reservations/:id`)
- **Request Body**:
```json
{
  "status": "Cancelled"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Reservation cancelled successfully and quantity restored",
  "data": {
    "id": 1,
    "listingId": 1,
    "quantityRestored": 2,
    "remainingQuantity": 10,
    "listingStatus": "Available",
    "status": "Cancelled"
  }
}
```
- **Response `409 Conflict` (Already Cancelled or Collected)**:
```json
{
  "success": false,
  "message": "Reservation is already cancelled and cannot be changed"
}
```

---

## Frontend Integration Code Snippets (JavaScript `fetch()`)

Provide this file (`src/api/saveMyMeal.js`) to teammates working on Modules A, B, and C:

```javascript
// Set base URL (or import from import.meta.env.VITE_API_BASE_URL)
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * MODULE A: Browse food listings
 */
export async function fetchListings(search = '', category = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);

  const res = await fetch(`${API_BASE_URL}/listings?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

/**
 * MODULE B: Add food listing
 */
export async function createListing(listingData) {
  const res = await fetch(`${API_BASE_URL}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listingData)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

/**
 * MODULE C: Reserve food
 */
export async function createReservation(listingId, userName, quantity) {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, userName, quantity })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

/**
 * MODULE C: View user reservations
 */
export async function fetchUserReservations(userName) {
  const res = await fetch(`${API_BASE_URL}/reservations?userName=${encodeURIComponent(userName)}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

/**
 * MODULE C: Cancel reservation
 */
export async function cancelReservation(reservationId) {
  const res = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Cancelled' })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
```
