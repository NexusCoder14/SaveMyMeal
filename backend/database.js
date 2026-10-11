/**
 * SaveMyMeal - SQLite Database Initialization & Connection
 * Module D: Backend & Database Foundation
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to SQLite database file
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.resolve(dataDir, 'savemymeal.db');

// Initialize SQLite database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${DB_PATH}`);
  }
});

/**
 * Initializes database tables and inserts demo seed data if tables are empty.
 * Returns a Promise that resolves when initialization is complete.
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Enable Foreign Key Constraints in SQLite
      db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) {
          console.error('Failed to enable foreign key constraints:', err.message);
          return reject(err);
        }
      });

      // 2. Create 'listings' table
      // Status values: 'Available', 'Partially Reserved', 'Reserved', 'Collected', 'Unavailable'
      db.run(`
        CREATE TABLE IF NOT EXISTS listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          foodName TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          quantity INTEGER NOT NULL CHECK(quantity > 0),
          remainingQuantity INTEGER NOT NULL CHECK(remainingQuantity >= 0),
          pickupLocation TEXT NOT NULL,
          collectionDeadline TEXT NOT NULL,
          donorName TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available', 'Partially Reserved', 'Reserved', 'Collected', 'Unavailable')),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating listings table:', err.message);
          return reject(err);
        }
      });

      // 3. Create 'reservations' table
      // Status values: 'Active', 'Cancelled', 'Collected'
      db.run(`
        CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          listingId INTEGER NOT NULL,
          userName TEXT NOT NULL,
          quantity INTEGER NOT NULL CHECK(quantity > 0),
          status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Cancelled', 'Collected')),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (listingId) REFERENCES listings(id) ON DELETE RESTRICT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating reservations table:', err.message);
          return reject(err);
        }
      });

      // 4. Seed initial sample listings without duplicating existing records
      db.get('SELECT COUNT(*) as count FROM listings', (err, row) => {
        if (err) return reject(err);

        // Only seed if no records currently exist
        if (row.count === 0) {
          const insertStmt = db.prepare(`
            INSERT INTO listings (
              foodName, description, category, quantity,
              remainingQuantity, pickupLocation, collectionDeadline,
              donorName, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const sampleListings = [
            [
              'Fresh Vegetable Sandwiches',
              'Grilled veg sandwiches with green chutney and cheese, made fresh this afternoon.',
              'Snacks',
              10,
              10,
              'College Canteen Counter 2',
              '2026-10-12T18:00:00',
              'Meet',
              'Available'
            ],
            [
              'Assorted Bakery Bread & Rolls',
              'Freshly baked whole wheat loaves, buns, and morning pastries.',
              'Bakery',
              8,
              8,
              'Campus North Bakery Stall',
              '2026-10-12T19:30:00',
              'Sunita',
              'Available'
            ],
            [
              'South Indian Thali Boxes',
              'Steamed idlis, medu vadas, sambar, and coconut chutney in sealed packs.',
              'Meals',
              6,
              6,
              'Main Dining Hall B',
              '2026-10-12T20:00:00',
              'Ravi',
              'Available'
            ],
            [
              'Seasonal Fruit Salad Cups',
              'Chopped fresh watermelon, papaya, apples, and pomegranate.',
              'Fruits',
              12,
              12,
              'Student Activity Center Juice Bar',
              '2026-10-12T17:00:00',
              'Priya',
              'Available'
            ]
          ];

          for (const item of sampleListings) {
            insertStmt.run(item);
          }

          insertStmt.finalize((finalizeErr) => {
            if (finalizeErr) return reject(finalizeErr);
            console.log('Sample listings seeded successfully into SQLite.');
            resolve();
          });
        } else {
          // Existing records preserved
          resolve();
        }
      });
    });
  });
}

module.exports = {
  db,
  initDatabase
};
