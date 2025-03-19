const axios = require("axios");

// base URL
const baseURL = "http://localhost:3000";

// sample user credentials
const sampleUser = { name: "Severus Snape", password: "1234" };

// helper function to authenticate the user
async function authenticateUser() {
    try {
        const res = await axios.post(`${baseURL}/authenticate`, sampleUser);
        console.log("User authenticated successfully", res.data);
        return res.data.token; // assuming a token is returned for further requests
    } catch (err) {
        console.error("Authentication failed", err.response?.data || err.message);
    }
}

// add a new book
async function addBook(token) {
    try {
        const res = await axios.post(
            `${baseURL}/books`,
            {
                title: "1984",
                author: "George Orwell",
                genre: "Dystopian Fiction"
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Book added successfully", res.data);
    } catch (err) {
        console.error("Failed to add book", err.response?.data || err.message);
    }
}

// lend a book
async function lendBook(token) {
    try {
        const res = await axios.post(
            `${baseURL}/books/lend/1`,
            {
                borrower: "Albus Dumbledore",
                dueDate: "2025-03-25"
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Book lent successfully", res.data);
    } catch (err) {
        console.error("Failed to lend book", err.response?.data || err.message);
    }
}

// view all books
async function viewAllBooks(token) {
    try {
        const res = await axios.get(`${baseURL}/books`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("All books", res.data);
    } catch (err) {
        console.error("Failed to fetch books", err.response?.data || err.message);
    }
}

// view borrowed books with filters
async function viewBorrowedBooks(token) {
    try {
        const res = await axios.get(`${baseURL}/books/borrowed?borrower=Albus Dumbledore`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Borrowed books", res.data);
    } catch (err) {
        console.error("Failed to fetch borrowed books", err.response?.data || err.message);
    }
}

// main function to invoke all methods
(async function testAPI() {
    const token = await authenticateUser();
    if (!token) return;

    await addBook(token);
    await lendBook(token);
    await viewAllBooks(token);
    await viewBorrowedBooks(token);
})();
