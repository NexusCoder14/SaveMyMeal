/**
 * SaveMyMeal - Reservations REST API Router
 * Module D: Backend & Database Foundation
 * Connects with Module C (Reservations)
 */

const express = require('express');
const { db } = require('./database');

const router = express.Router();

/**
 * Valid reservation statuses
 */
const VALID_RESERVATION_STATUSES = ['Active', 'Cancelled', 'Collected'];

/**
 * Determines new listing status based on remaining quantity and original total
 * Status progression:
 *   - remaining == 0 -> 'Reserved'
 *   - remaining < total && remaining > 0 -> 'Partially Reserved'
 *   - remaining == total -> 'Available'
 */
function calculateListingStatus(remaining, total) {
  if (remaining <= 0) return 'Reserved';
  if (remaining < total) return 'Partially Reserved';
  return 'Available';
}

/**
 * GET /api/reservations
 * Fetch reservations with joined listing details (foodName, pickupLocation, status, etc.)
 * Optional query params:
 *   - userName: filter reservations for a specific user
 *   - status: filter by reservation status ('Active', 'Cancelled', 'Collected')
 */
router.get('/', (req, res) => {
  const { userName, status } = req.query;

  let sql = `
    SELECT 
      r.id,
      r.listingId,
      r.userName,
      r.quantity,
      r.status,
      r.createdAt,
      l.foodName,
      l.category,
      l.pickupLocation,
      l.collectionDeadline,
      l.donorName,
      l.status AS listingStatus
    FROM reservations r
    JOIN listings l ON r.listingId = l.id
    WHERE 1=1
  `;
  const params = [];

  if (userName) {
    sql += ' AND LOWER(r.userName) = LOWER(?)';
    params.push(userName.trim());
  }

  if (status) {
    sql += ' AND LOWER(r.status) = LOWER(?)';
    params.push(status.trim());
  }

  sql += ' ORDER BY r.createdAt DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching reservations:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while retrieving reservations'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: rows
    });
  });
});

/**
 * POST /api/reservations
 * Reserve food from a listing
 * Request body:
 *   - listingId (integer, required)
 *   - userName (string, required)
 *   - quantity (integer > 0, required)
 *
 * Enforces transactional consistency:
 * 1. Checks listing availability, status, and remaining quantity
 * 2. Deducts quantity from listings.remainingQuantity
 * 3. Updates listing status ('Partially Reserved' or 'Reserved')
 * 4. Inserts new reservation record with status 'Active'
 */
router.post('/', (req, res) => {
  const { listingId, userName, quantity } = req.body;

  // Validation
  const errors = [];
  const parsedListingId = parseInt(listingId, 10);
  const parsedQuantity = parseInt(quantity, 10);

  if (!listingId || isNaN(parsedListingId) || parsedListingId <= 0) {
    errors.push('listingId is required and must be a valid positive integer.');
  }
  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    errors.push('userName is required.');
  }
  if (quantity === undefined || !Number.isInteger(quantity) || parsedQuantity <= 0) {
    errors.push('quantity is required and must be a positive integer greater than 0.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: ' + errors.join(' ')
    });
  }

  // Transaction execution
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE TRANSACTION;', (beginErr) => {
      if (beginErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initiate transaction: ' + beginErr.message
        });
      }

      // 1. Fetch listing details
      db.get('SELECT * FROM listings WHERE id = ?', [parsedListingId], (fetchErr, listing) => {
        if (fetchErr) {
          db.run('ROLLBACK;');
          return res.status(500).json({
            success: false,
            message: 'Database error occurred while checking listing: ' + fetchErr.message
          });
        }

        if (!listing) {
          db.run('ROLLBACK;');
          return res.status(404).json({
            success: false,
            message: `Listing with ID ${parsedListingId} not found`
          });
        }

        // Check if listing is active for reservations
        if (listing.status === 'Unavailable' || listing.status === 'Collected') {
          db.run('ROLLBACK;');
          return res.status(409).json({
            success: false,
            message: `Listing is ${listing.status} and cannot be reserved`
          });
        }

        if (listing.remainingQuantity <= 0 || listing.status === 'Reserved') {
          db.run('ROLLBACK;');
          return res.status(409).json({
            success: false,
            message: 'Listing is fully reserved (none remaining)'
          });
        }

        if (listing.remainingQuantity < parsedQuantity) {
          db.run('ROLLBACK;');
          return res.status(409).json({
            success: false,
            message: `Insufficient quantity available. Requested ${parsedQuantity}, but only ${listing.remainingQuantity} available.`
          });
        }

        // Calculate new remaining quantity and updated status
        const newRemaining = listing.remainingQuantity - parsedQuantity;
        const newListingStatus = calculateListingStatus(newRemaining, listing.quantity);

        // 2. Update listing remainingQuantity and status
        db.run(
          'UPDATE listings SET remainingQuantity = ?, status = ? WHERE id = ?',
          [newRemaining, newListingStatus, parsedListingId],
          function (updateErr) {
            if (updateErr) {
              db.run('ROLLBACK;');
              return res.status(500).json({
                success: false,
                message: 'Failed to update listing inventory: ' + updateErr.message
              });
            }

            // 3. Insert reservation record
            const insertSql = `
              INSERT INTO reservations (listingId, userName, quantity, status)
              VALUES (?, ?, ?, 'Active')
            `;

            db.run(insertSql, [parsedListingId, userName.trim(), parsedQuantity], function (insertErr) {
              if (insertErr) {
                db.run('ROLLBACK;');
                return res.status(500).json({
                  success: false,
                  message: 'Failed to create reservation record: ' + insertErr.message
                });
              }

              const newReservationId = this.lastID;

              // 4. Commit transaction
              db.run('COMMIT;', (commitErr) => {
                if (commitErr) {
                  db.run('ROLLBACK;');
                  return res.status(500).json({
                    success: false,
                    message: 'Transaction commit failed: ' + commitErr.message
                  });
                }

                // Return structured response
                res.status(201).json({
                  success: true,
                  message: 'Reservation created successfully',
                  data: {
                    id: newReservationId,
                    listingId: parsedListingId,
                    foodName: listing.foodName,
                    pickupLocation: listing.pickupLocation,
                    collectionDeadline: listing.collectionDeadline,
                    userName: userName.trim(),
                    quantity: parsedQuantity,
                    remainingQuantity: newRemaining,
                    listingStatus: newListingStatus,
                    status: 'Active'
                  }
                });
              });
            });
          }
        );
      });
    });
  });
});

/**
 * PATCH /api/reservations/:id
 * Update reservation status (Cancel or Collected)
 * When cancelling:
 *   - Restores the reserved quantity to the listing
 *   - Recalculates listing status
 *   - Rejects if already Cancelled or Collected
 */
router.patch('/:id', (req, res) => {
  const reservationId = parseInt(req.params.id, 10);
  if (isNaN(reservationId) || reservationId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reservation ID provided'
    });
  }

  const { status } = req.body;
  if (!status || !VALID_RESERVATION_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_RESERVATION_STATUSES.join(', ')}`
    });
  }

  db.serialize(() => {
    db.run('BEGIN IMMEDIATE TRANSACTION;', (beginErr) => {
      if (beginErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initiate transaction: ' + beginErr.message
        });
      }

      // Fetch existing reservation
      db.get('SELECT * FROM reservations WHERE id = ?', [reservationId], (resErr, reservation) => {
        if (resErr) {
          db.run('ROLLBACK;');
          return res.status(500).json({
            success: false,
            message: 'Database error occurred: ' + resErr.message
          });
        }

        if (!reservation) {
          db.run('ROLLBACK;');
          return res.status(404).json({
            success: false,
            message: `Reservation with ID ${reservationId} not found`
          });
        }

        // Business rules check
        if (reservation.status === 'Cancelled') {
          db.run('ROLLBACK;');
          return res.status(409).json({
            success: false,
            message: 'Reservation is already cancelled and cannot be changed'
          });
        }

        if (reservation.status === 'Collected') {
          db.run('ROLLBACK;');
          return res.status(409).json({
            success: false,
            message: 'Reservation has already been marked as collected and cannot be cancelled or altered'
          });
        }

        // Case 1: Status changed to Cancelled -> restore listing quantity
        if (status === 'Cancelled') {
          db.get('SELECT * FROM listings WHERE id = ?', [reservation.listingId], (listingErr, listing) => {
            if (listingErr || !listing) {
              db.run('ROLLBACK;');
              return res.status(500).json({
                success: false,
                message: 'Failed to find parent listing to restore quantity'
              });
            }

            const restoredQuantity = listing.remainingQuantity + reservation.quantity;
            const updatedListingStatus = calculateListingStatus(restoredQuantity, listing.quantity);

            // Update listing
            db.run(
              'UPDATE listings SET remainingQuantity = ?, status = ? WHERE id = ?',
              [restoredQuantity, updatedListingStatus, listing.id],
              (updateListingErr) => {
                if (updateListingErr) {
                  db.run('ROLLBACK;');
                  return res.status(500).json({
                    success: false,
                    message: 'Failed to restore listing quantity: ' + updateListingErr.message
                  });
                }

                // Update reservation
                db.run(
                  'UPDATE reservations SET status = ? WHERE id = ?',
                  ['Cancelled', reservationId],
                  (updateResErr) => {
                    if (updateResErr) {
                      db.run('ROLLBACK;');
                      return res.status(500).json({
                        success: false,
                        message: 'Failed to update reservation status: ' + updateResErr.message
                      });
                    }

                    db.run('COMMIT;', (commitErr) => {
                      if (commitErr) {
                        db.run('ROLLBACK;');
                        return res.status(500).json({
                          success: false,
                          message: 'Commit failed: ' + commitErr.message
                        });
                      }

                      res.status(200).json({
                        success: true,
                        message: 'Reservation cancelled successfully and quantity restored',
                        data: {
                          id: reservationId,
                          listingId: reservation.listingId,
                          quantityRestored: reservation.quantity,
                          remainingQuantity: restoredQuantity,
                          listingStatus: updatedListingStatus,
                          status: 'Cancelled'
                        }
                      });
                    });
                  }
                );
              }
            );
          });
        } else {
          // Case 2: Status updated to 'Collected' (no quantity restore)
          db.run(
            'UPDATE reservations SET status = ? WHERE id = ?',
            [status, reservationId],
            (updateResErr) => {
              if (updateResErr) {
                db.run('ROLLBACK;');
                return res.status(500).json({
                  success: false,
                  message: 'Failed to update reservation status: ' + updateResErr.message
                });
              }

              db.run('COMMIT;', (commitErr) => {
                if (commitErr) {
                  db.run('ROLLBACK;');
                  return res.status(500).json({
                    success: false,
                    message: 'Commit failed: ' + commitErr.message
                  });
                }

                res.status(200).json({
                  success: true,
                  message: `Reservation status updated to ${status}`,
                  data: {
                    id: reservationId,
                    listingId: reservation.listingId,
                    status
                  }
                });
              });
            }
          );
        }
      });
    });
  });
});

module.exports = router;
