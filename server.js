// server.js
const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('users.db');

// Middleware
app.use(express.json());
app.use(cors());

// --- Create members table ---
db.run(`
  CREATE TABLE IF NOT EXISTS members (
    name TEXT,
    email TEXT PRIMARY KEY,
    password TEXT,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  )
`, (err) => {
  if (err) console.error("Error creating members table:", err.message);
  else console.log("Members table ready.");
});

// --- Create enrollments table ---
db.run(`
  CREATE TABLE IF NOT EXISTS enrollments (
    email TEXT,
    course_id TEXT,
    enrolled_at DATETIME DEFAULT (datetime('now', 'localtime')),
    PRIMARY KEY (email, course_id)
  )
`, (err) => {
  if (err) console.error("Error creating enrollments table:", err.message);
  else console.log("Enrollments table ready.");
});

// --- Signup ---
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ status: "Missing fields" });

  const query = "INSERT INTO members (name, email, password) VALUES (?, ?, ?)";
  db.run(query, [name, email, password], function(err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ status: "Email already exists" });
      } else {
        console.error(err);
        res.status(500).json({ status: "Error during signup" });
      }
    } else {
      res.json({ status: "Success" });
    }
  });
});

// --- Signin ---
app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ status: "Missing fields" });

  const query = "SELECT name FROM members WHERE email = ? AND password = ?";
  db.get(query, [email, password], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ status: "Error during signin" });
    } else if (row) {
      res.json({ status: "Success", name: row.name });
    } else {
      res.json({ status: "Invalid email or password" });
    }
  });
});

// --- Enroll in course ---
app.post('/enroll', (req, res) => {
  const { email, course_id } = req.body;
  if (!email || !course_id) return res.status(400).json({ status: "Missing email or course_id" });

  const query = "INSERT OR IGNORE INTO enrollments (email, course_id) VALUES (?, ?)";
  db.run(query, [email, course_id], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ status: "Error enrolling" });
    } else {
      res.json({ status: "Enrolled successfully" });
    }
  });
});

// --- Get enrollments for a user ---
app.get('/enrollments/:email', (req, res) => {
  const email = req.params.email;
  const query = "SELECT course_id, enrolled_at FROM enrollments WHERE email = ?";
  db.all(query, [email], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ status: "Error fetching enrollments" });
    } else {
      res.json(rows);
    }
  });
});

// --- Get all users (testing) ---
app.get('/users', (req, res) => {
  const query = "SELECT name, email, created_at FROM members";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ status: "Error fetching users" });
    } else {
      res.json(rows);
    }
  });
});

// --- Start server ---
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
