const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json()); // middleware to parse JSON requests

// arrays to act as the "database"
const users = [
    { id: 1, name: "Severus Snape", password: "1234" },
    { id: 2, name: "Draco Malfoy", password: "5678" },
];

const books = [
    { id: 1, title: "The Book Thief", author: "Markus Zusak", genre: "Historical Fiction", borrower: null, dueDate: null },
    { id: 2, title: "Six of Crows", author: "Leigh Bardugo", genre: "Fantasy, Young Adult", borrower: null, dueDate: null },
];

// authentication middleware
function authenticate(req, res, next) {
    const { name, password } = req.body; // extract credentials from the body
    const user = users.find((u) => u.name === name && u.password === password);
    if (!user) {
        return res.status(401).json({ message: "Authentication failed" });
    }
    req.user = user;
    next();
}

// add a new book to the system
app.post("/books", authenticate, (req, res) => {
    const { title, author, genre } = req.body;
    const id = books.length + 1;
    books.push({ id, title, author, genre, borrower: null, dueDate: null });
    res.json({ message: "Book added successfully", book: { id, title, author, genre } });
});

// lend a book
app.post("/books/lend/:id", authenticate, (req, res) => {
    const { id } = req.params;
    const { borrower, dueDate } = req.body;
    const book = books.find((b) => b.id === parseInt(id));

    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (book.borrower) {
        return res.status(400).json({ message: "Book is already borrowed" });
    }

    book.borrower = borrower;
    book.dueDate = dueDate;
    res.json({ message: "Book lent successfully", book });
});

// view all books
app.get("/books", authenticate, (req, res) => {
    res.json(books);
});

// view borrowed books, filter by genre or borrower
app.get("/books/borrowed", authenticate, (req, res) => {
    const { category, borrower } = req.query;
    let borrowedBooks = books.filter((b) => b.borrower);

    if (category) {
        borrowedBooks = borrowedBooks.filter((b) => b.category === category);
    }

    if (borrower) {
        borrowedBooks = borrowedBooks.filter((b) => b.borrower === borrower);
    }

    res.json(borrowedBooks);
});

// start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
