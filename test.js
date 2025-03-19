// test.js
const request = require("supertest");
const app = require("./index");

test("Should register a new user", async () => {
    const res = await request(app)
        .post("/register")
        .send({ username: "testUser", password: "password" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User registered successfully");
});

test("Should login successfully", async () => {
    await request(app)
        .post("/register")
        .send({ username: "testUser2", password: "password" });

    const res = await request(app)
        .post("/login")
        .send({ username: "testUser2", password: "password" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
});

test("Should lend a book", async () => {
    const res = await request(app)
        .post("/lend")
        .send({ title: "1984", author: "George Orwell", borrower: "Alice", dueDate: "2025-04-01", category: "Fiction" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Book lent successfully");
});

test("Should fetch all borrowed books", async () => {
  
