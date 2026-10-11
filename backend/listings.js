/**
 * SaveMyMeal - Listings REST API Router
 * Module D: Backend & Database Foundation
 * Connects with Module A (Browse Food) and Module B (Add Food)
 */

const express = require('express');
const { db } = require('./database');

const router = express.Router();

/**
 * Valid listing statuses
 */
const VALID_LISTING_STATUSES = ['Available', 'Partially Reserved', 'Reserved', 'Collected', 'Unavailable'];

/**
 * GET /api/listings
 * Browse food listings with optional query filtering
 * Query params:
 *   - search: keyword search in foodName, description, pickupLocation
 *   - category: exact or case-insensitive category match
 *   - status: filter by listing status (default returns all active/viewable)
 */
router.get('/', (req, res) => {
  const { search, category, status } = req.query;

  let sql = 'SELECT * FROM listings WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND LOWER(status) = LOWER(?)';
    params.push(status.trim());
  }

  if (category) {
    sql += ' AND LOWER(category) = LOWER(?)';
    params.push(category.trim());
  }

  if (search) {
    sql += ' AND (LOWER(foodName) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(pickupLocation) LIKE LOWER(?))';
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  sql += ' ORDER BY createdAt DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching listings:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while retrieving listings'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Listings retrieved successfully',
      data: rows
    });
  });
});

/**
 * GET /api/listings/:id
 * Retrieve a single food listing by ID
 */
router.get('/:id', (req, res) => {
  const listingId = parseInt(req.params.id, 10);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid listing ID provided'
    });
  }

  db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, row) => {
    if (err) {
      console.error('Error fetching listing by ID:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while retrieving listing'
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: `Listing with ID ${listingId} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Listing retrieved successfully',
      data: row
    });
  });
});

/**
 * POST /api/listings
 * Create a new surplus food listing (Module B integration)
 * Request body:
 *   - foodName (string, required)
 *   - description (string, optional)
 *   - category (string, required)
 *   - quantity (integer > 0, required)
 *   - pickupLocation (string, required)
 *   - collectionDeadline (string, required)
 *   - donorName (string, required)
 */
router.post('/', (req, res) => {
  const {
    foodName,
    description,
    category,
    quantity,
    pickupLocation,
    collectionDeadline,
    donorName
  } = req.body;

  // Input validation
  const errors = [];
  if (!foodName || typeof foodName !== 'string' || !foodName.trim()) {
    errors.push('foodName is required and must be non-empty string.');
  }
  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('category is required.');
  }
  if (quantity === undefined || !Number.isInteger(quantity) || quantity <= 0) {
    errors.push('quantity is required and must be a positive integer greater than 0.');
  }
  if (!pickupLocation || typeof pickupLocation !== 'string' || !pickupLocation.trim()) {
    errors.push('pickupLocation is required.');
  }
  if (!collectionDeadline || typeof collectionDeadline !== 'string' || !collectionDeadline.trim()) {
    errors.push('collectionDeadline is required.');
  }
  if (!donorName || typeof donorName !== 'string' || !donorName.trim()) {
    errors.push('donorName is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: ' + errors.join(' ')
    });
  }

  // Initialize remainingQuantity = quantity and status = 'Available'
  const initialQuantity = parseInt(quantity, 10);
  const remainingQuantity = initialQuantity;
  const initialStatus = 'Available';

  const insertSql = `
    INSERT INTO listings (
      foodName, description, category, quantity,
      remainingQuantity, pickupLocation, collectionDeadline,
      donorName, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    foodName.trim(),
    description ? description.trim() : '',
    category.trim(),
    initialQuantity,
    remainingQuantity,
    pickupLocation.trim(),
    collectionDeadline.trim(),
    donorName.trim(),
    initialStatus
  ];

  db.run(insertSql, params, function (err) {
    if (err) {
      console.error('Error inserting listing:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while creating listing'
      });
    }

    const newId = this.lastID;

    db.get('SELECT * FROM listings WHERE id = ?', [newId], (fetchErr, createdRecord) => {
      if (fetchErr || !createdRecord) {
        return res.status(201).json({
          success: true,
          message: 'Listing created successfully',
          data: { id: newId }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        data: createdRecord
      });
    });
  });
});

/**
 * PATCH /api/listings/:id
 * Edit listing details or status (e.g. mark Collected or Unavailable)
 */
router.patch('/:id', (req, res) => {
  const listingId = parseInt(req.params.id, 10);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid listing ID provided'
    });
  }

  db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, existing) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while fetching listing'
      });
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Listing with ID ${listingId} not found`
      });
    }

    const {
      foodName,
      description,
      category,
      pickupLocation,
      collectionDeadline,
      donorName,
      status
    } = req.body;

    if (status && !VALID_LISTING_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_LISTING_STATUSES.join(', ')}`
      });
    }

    const updatedFoodName = foodName !== undefined ? foodName.trim() : existing.foodName;
    const updatedDescription = description !== undefined ? description.trim() : existing.description;
    const updatedCategory = category !== undefined ? category.trim() : existing.category;
    const updatedPickupLocation = pickupLocation !== undefined ? pickupLocation.trim() : existing.pickupLocation;
    const updatedCollectionDeadline = collectionDeadline !== undefined ? collectionDeadline.trim() : existing.collectionDeadline;
    const updatedDonorName = donorName !== undefined ? donorName.trim() : existing.donorName;
    const updatedStatus = status !== undefined ? status : existing.status;

    const updateSql = `
      UPDATE listings SET
        foodName = ?,
        description = ?,
        category = ?,
        pickupLocation = ?,
        collectionDeadline = ?,
        donorName = ?,
        status = ?
      WHERE id = ?
    `;

    const params = [
      updatedFoodName,
      updatedDescription,
      updatedCategory,
      updatedPickupLocation,
      updatedCollectionDeadline,
      updatedDonorName,
      updatedStatus,
      listingId
    ];

    db.run(updateSql, params, function (updateErr) {
      if (updateErr) {
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while updating listing'
        });
      }

      db.get('SELECT * FROM listings WHERE id = ?', [listingId], (fetchErr, updatedRecord) => {
        res.status(200).json({
          success: true,
          message: 'Listing updated successfully',
          data: updatedRecord
        });
      });
    });
  });
});

/**
 * DELETE /api/listings/:id
 * Remove listing only if it has no associated reservations
 */
router.delete('/:id', (req, res) => {
  const listingId = parseInt(req.params.id, 10);
  if (isNaN(listingId) || listingId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid listing ID provided'
    });
  }

  // Check if listing has reservations to prevent breaking reservation history
  db.get('SELECT COUNT(*) as reservationCount FROM reservations WHERE listingId = ?', [listingId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred'
      });
    }

    if (row && row.reservationCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete listing ID ${listingId} because it has ${row.reservationCount} associated reservation(s). You may mark its status as 'Unavailable' instead.`
      });
    }

    db.run('DELETE FROM listings WHERE id = ?', [listingId], function (deleteErr) {
      if (deleteErr) {
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while deleting listing'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: `Listing with ID ${listingId} not found`
        });
      }

      res.status(200).json({
        success: true,
        message: `Listing ID ${listingId} deleted successfully`
      });
    });
  });
});

module.exports = router;
