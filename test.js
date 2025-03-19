// test.js
const request = require("supertest");
const app = require("./index");

describe("Book Lending System API", () => {
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
        const res = await request(app)
            .get("/books");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("Should filter borrowed books by borrower", async () => {
        await request(app)
            .post("/lend")
            .send({ title: "Brave New World", author: "Aldous Huxley", borrower: "Bob", dueDate: "2025-05-01", category: "Fiction" });

        const res = await request(app)
            .get("/books")
            .query({ borrower: "Bob" });

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].borrower).toBe("Bob");
    });
});
