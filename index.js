require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

const users = [];
const books = [];

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (users.find((u) => u.email === email)) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, username, email, password: hashedPassword };
  users.push(user);

  res.status(201).json({ message: "User registered successfully" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.post("/api/books/borrow", authMiddleware, (req, res) => {
  const { title, author, category, borrower, dueDate } = req.body;
  const book = { id: books.length + 1, title, author, category, borrower, dueDate };
  books.push(book);

  res.status(201).json({ message: "Book borrowed successfully", book });
});

app.get("/api/books", authMiddleware, (req, res) => {
  const { category, borrower } = req.query;
  let filteredBooks = books;

  if (category) filteredBooks = filteredBooks.filter((book) => book.category === category);
  if (borrower) filteredBooks = filteredBooks.filter((book) => book.borrower === borrower);

  res.json(filteredBooks);
});

// Force server to bind to 127.0.0.1 to avoid IPv6 issues
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
}).on("error", (err) => {
  console.error("❌ Server failed to start:", err);
});

// Export both app and server to properly close it in tests
module.exports = { app, server };
