/**
 * Automated HTTP Integration Test Suite
 * Module D: SaveMyMeal Backend & Database Foundation
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Use dedicated test database
const testDataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

const testDbPath = path.resolve(testDataDir, 'test_module_d.db');
if (fs.existsSync(testDbPath)) {
  try {
    fs.unlinkSync(testDbPath);
  } catch (e) {
    // ignore
  }
}

process.env.DB_PATH = testDbPath;
const TEST_PORT = 3003;

const { startServer } = require('../server');

function makeRequest({ method, path: reqPath, body, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: reqPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          parsed = raw;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, description) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${description}`);
  }
  console.log(`  ✓ PASS: ${description}`);
}

async function runTests() {
  console.log('====================================================');
  console.log(' Starting Module D Backend Automated Test Suite');
  console.log('====================================================\n');

  const server = await startServer(TEST_PORT);

  try {
    // 1. Health check test
    console.log('[Test 1] Health Check (GET /api/health)');
    const resHealth = await makeRequest({ method: 'GET', path: '/api/health' });
    assert(resHealth.statusCode === 200, 'Returns 200 OK');
    assert(resHealth.body.success === true, 'Response indicates success = true');

    // 2. Initial sample listings from seed
    console.log('\n[Test 2] Seed Listings Verification (GET /api/listings)');
    const resListings = await makeRequest({ method: 'GET', path: '/api/listings' });
    assert(resListings.statusCode === 200, 'GET /api/listings returns 200 OK');
    assert(Array.isArray(resListings.body.data), 'Returns array of listings');
    assert(resListings.body.data.length >= 4, 'Seeded with at least 4 sample listings');
    assert(resListings.body.data[0].foodName !== undefined, 'Listings have foodName field');
    assert(resListings.body.data[0].remainingQuantity !== undefined, 'Listings have remainingQuantity field');

    // 3. Search and category filter
    console.log('\n[Test 3] Filter & Search Listings');
    const resFiltered = await makeRequest({
      method: 'GET',
      path: '/api/listings?search=sandwiches&category=Snacks'
    });
    assert(resFiltered.statusCode === 200, 'Search query returns 200 OK');
    assert(resFiltered.body.data.length >= 1, 'Found at least 1 matching snack listing');
    assert(resFiltered.body.data[0].foodName.toLowerCase().includes('sandwich'), 'Title matches keyword');

    // 4. Create new food listing (Module B contract)
    console.log('\n[Test 4] Create Food Listing (POST /api/listings)');
    const newListing = {
      foodName: 'Vegetable Biryani Pots',
      description: 'Fragrant basmati rice with spiced seasonal vegetables.',
      category: 'Meals',
      quantity: 5,
      pickupLocation: 'South Cafeteria Stall 3',
      collectionDeadline: '2026-10-12T20:30:00',
      donorName: 'Aarav'
    };
    const resCreate = await makeRequest({ method: 'POST', path: '/api/listings', body: newListing });
    assert(resCreate.statusCode === 201, 'POST /api/listings returns 201 Created');
    assert(resCreate.body.success === true, 'Creation response success is true');
    assert(resCreate.body.data.remainingQuantity === 5, 'remainingQuantity matches initial quantity (5)');
    assert(resCreate.body.data.status === 'Available', 'Initial status set to Available');
    const createdListingId = resCreate.body.data.id;

    // 5. Validation rejection on invalid listing
    console.log('\n[Test 5] Validation Failure on Malformed Listing');
    const resInvalidCreate = await makeRequest({
      method: 'POST',
      path: '/api/listings',
      body: { foodName: '', quantity: -2 }
    });
    assert(resInvalidCreate.statusCode === 400, 'Returns 400 Bad Request');
    assert(resInvalidCreate.body.success === false, 'Returns success: false');

    // 6. Create reservation and verify quantity deduction
    console.log('\n[Test 6] Reserve Food (POST /api/reservations)');
    const resReserve = await makeRequest({
      method: 'POST',
      path: '/api/reservations',
      body: {
        listingId: createdListingId,
        userName: 'Rahul',
        quantity: 2
      }
    });
    assert(resReserve.statusCode === 201, 'Returns 201 Created');
    assert(resReserve.body.data.quantity === 2, 'Reserved quantity is 2');
    assert(resReserve.body.data.remainingQuantity === 3, 'Remaining quantity correctly decremented to 3');
    assert(resReserve.body.data.listingStatus === 'Partially Reserved', 'Listing status updated to Partially Reserved');
    const reservationId1 = resReserve.body.data.id;

    // 7. Verify reservation retrieval by userName
    console.log('\n[Test 7] Retrieve Reservations by userName');
    const resUserRes = await makeRequest({
      method: 'GET',
      path: '/api/reservations?userName=Rahul'
    });
    assert(resUserRes.statusCode === 200, 'Returns 200 OK');
    assert(resUserRes.body.data.length >= 1, 'Found reservation for Rahul');
    assert(resUserRes.body.data[0].foodName === 'Vegetable Biryani Pots', 'Joined listing foodName returned');

    // 8. Prevent over-reserving (requesting more than available)
    console.log('\n[Test 8] Prevent Over-Reserving');
    const resOver = await makeRequest({
      method: 'POST',
      path: '/api/reservations',
      body: {
        listingId: createdListingId,
        userName: 'Vikram',
        quantity: 10 // Only 3 left!
      }
    });
    assert(resOver.statusCode === 409, 'Returns 409 Conflict when quantity is insufficient');
    assert(resOver.body.success === false, 'Returns success: false');

    // 9. Reserve all remaining quantity -> verify status is 'Reserved'
    console.log('\n[Test 9] Reserve Remaining Quantity -> Verify "Reserved" Status');
    const resReserveAll = await makeRequest({
      method: 'POST',
      path: '/api/reservations',
      body: {
        listingId: createdListingId,
        userName: 'Ananya',
        quantity: 3 // Exact remaining
      }
    });
    assert(resReserveAll.statusCode === 201, 'Returns 201 Created');
    assert(resReserveAll.body.data.remainingQuantity === 0, 'Remaining quantity is 0');
    assert(resReserveAll.body.data.listingStatus === 'Reserved', 'Listing status is Reserved');
    const reservationId2 = resReserveAll.body.data.id;

    // 10. Attempt to reserve an exhausted listing
    console.log('\n[Test 10] Reject Reservation on Exhausted Listing');
    const resExhausted = await makeRequest({
      method: 'POST',
      path: '/api/reservations',
      body: {
        listingId: createdListingId,
        userName: 'Sanjay',
        quantity: 1
      }
    });
    assert(resExhausted.statusCode === 409, 'Returns 409 Conflict on exhausted listing');

    // 11. Cancel reservation and verify quantity restored
    console.log('\n[Test 11] Cancel Reservation & Restore Quantity (PATCH /api/reservations/:id)');
    const resCancel = await makeRequest({
      method: 'PATCH',
      path: `/api/reservations/${reservationId2}`,
      body: { status: 'Cancelled' }
    });
    assert(resCancel.statusCode === 200, 'Returns 200 OK');
    assert(resCancel.body.data.status === 'Cancelled', 'Status updated to Cancelled');
    assert(resCancel.body.data.remainingQuantity === 3, 'Restored remaining quantity to 3');
    assert(resCancel.body.data.listingStatus === 'Partially Reserved', 'Listing status recalculated to Partially Reserved');

    // 12. Reject repeated cancellation
    console.log('\n[Test 12] Reject Repeated Cancellation');
    const resRepeatCancel = await makeRequest({
      method: 'PATCH',
      path: `/api/reservations/${reservationId2}`,
      body: { status: 'Cancelled' }
    });
    assert(resRepeatCancel.statusCode === 409, 'Returns 409 Conflict when cancelling already cancelled reservation');

    // 13. Prevent deleting listing with existing reservation history
    console.log('\n[Test 13] Prevent Deleting Listing with Existing Reservations');
    const resDeleteProtected = await makeRequest({
      method: 'DELETE',
      path: `/api/listings/${createdListingId}`
    });
    assert(resDeleteProtected.statusCode === 409, 'Returns 409 Conflict to protect foreign key and reservation integrity');

    // 14. Mark reservation as Collected and ensure it cannot be cancelled
    console.log('\n[Test 14] Mark Reservation Collected and Prevent Cancellation');
    const resCollect = await makeRequest({
      method: 'PATCH',
      path: `/api/reservations/${reservationId1}`,
      body: { status: 'Collected' }
    });
    assert(resCollect.statusCode === 200, 'Returns 200 OK');
    assert(resCollect.body.data.status === 'Collected', 'Status updated to Collected');

    const resCancelCollected = await makeRequest({
      method: 'PATCH',
      path: `/api/reservations/${reservationId1}`,
      body: { status: 'Cancelled' }
    });
    assert(resCancelCollected.statusCode === 409, 'Returns 409 Conflict when attempting to cancel collected reservation');

    // 15. Verify CORS header for Vite React frontend
    console.log('\n[Test 15] CORS Headers Verification for http://localhost:5173');
    const resCors = await makeRequest({
      method: 'GET',
      path: '/api/listings',
      headers: { Origin: 'http://localhost:5173' }
    });
    assert(
      resCors.headers['access-control-allow-origin'] === 'http://localhost:5173',
      'Access-Control-Allow-Origin header set for http://localhost:5173'
    );

    console.log('\n====================================================');
    console.log(' ALL 15 AUTOMATED TESTS PASSED SUCCESSFULLY! ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log('Integration test server closed.\n');
    });
  }
}

runTests();
