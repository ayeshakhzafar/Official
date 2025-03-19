const express = require("express");

const app = express();
app.use(express.json());

const users = [];
const books = [];

app.post("/api/register", (req, res) => {
  const { username, email } = req.body;
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  users.push({ id: users.length + 1, username, email });
  res.status(201).json({ message: "User registered successfully" });
});

app.post("/api/books/borrow", (req, res) => {
  const { title, author, category, borrower, dueDate } = req.body;
  const book = { id: books.length + 1, title, author, category, borrower, dueDate };
  books.push(book);
  res.status(201).json({ message: "Book borrowed successfully", book });
});

app.get("/api/books", (req, res) => {
  const { category, borrower } = req.query;
  let filteredBooks = books;

  if (category) filteredBooks = filteredBooks.filter((book) => book.category === category);
  if (borrower) filteredBooks = filteredBooks.filter((book) => book.borrower === borrower);

  res.json(filteredBooks);
});

const PORT = 5000;
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
}).on("error", (err) => {
  console.error("Server failed to start:", err);
});

module.exports = { app, server };
