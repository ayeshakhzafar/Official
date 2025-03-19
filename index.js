// index.js
const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");

app.use(bodyParser.json());

let users = [];
let books = [];

// User Authentication - Register
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ message: "User already exists" });
    }
    users.push({ username, password });
    res.json({ message: "User registered successfully" });
});

// User Authentication - Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful" });
});

// Add a Book
app.post("/lend", (req, res) => {
    const { title, author, borrower, dueDate, category } = req.body;
    books.push({ title, author, borrower, dueDate, category });
    res.json({ message: "Book lent successfully" });
});

// View Borrowed Books with Filters
app.get("/books", (req, res) => {
    const { borrower, category, dueDate } = req.query;
    let filteredBooks = books;
    if (borrower) filteredBooks = filteredBooks.filter(book => book.borrower === borrower);
    if (category) filteredBooks = filteredBooks.filter(book => book.category === category);
    if (dueDate) filteredBooks = filteredBooks.filter(book => book.dueDate === dueDate);
    res.json(filteredBooks);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
