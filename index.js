const express = require("express");

const app = express();
app.use(express.json());

const users = []; // Simple array for storing users
const books = []; // Simple array for storing borrowed books

// Health check route (for GitHub Actions)
app.get("/health", (req, res) => {
  res.status(200).send("✅ Server is healthy!");
});

// Register a user
app.post("/api/register", (req, res) => {
  const { username, email } = req.body;
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  users.push({ id: users.length + 1, username, email });
  res.status(201).json({ message: "User registered successfully" });
});

// Borrow a book
app.post("/api/books/borrow", (req, res) => {
  const { title, author, category, borrower, dueDate } = req.body;
  const book = { id: books.length + 1, title, author, category, borrower, dueDate };
  books.push(book);
  res.status(201).json({ message: "Book borrowed successfully", book });
});

// Get all borrowed books (can filter by category or borrower)
app.get("/api/books", (req, res) => {
  const { category, borrower } = req.query;
  let filteredBooks = books;

  if (category) filteredBooks = filteredBooks.filter((book) => book.category === category);
  if (borrower) filteredBooks = filteredBooks.filter((book) => book.borrower === borrower);

  res.json(filteredBooks);
});

// Start the server
const PORT = 5000;
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
}).on("error", (err) => {
  console.error("❌ Server failed to start:", err);
});

// Export app and server for testing
module.exports = { app, server };
