const request = require("supertest");
const { app, server } = require("./index"); // Import both app & server

describe("Book Lending System", () => {
  let token;

  it("should register a user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    console.log("Register Response:", res.body); // Debugging
    expect(res.statusCode).toBe(201);
  });

  it("should login a user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });
    console.log("Login Response:", res.body); // Debugging
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should allow a user to borrow a book", async () => {
    const res = await request(app)
      .post("/api/books/borrow")
      .set("Authorization", token)
      .send({
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        category: "Fiction",
        borrower: "John Doe",
        dueDate: "2025-03-30",
      });
    console.log("Borrow Book Response:", res.body); // Debugging
    expect(res.statusCode).toBe(201);
  });

  it("should retrieve borrowed books", async () => {
    const res = await request(app)
      .get("/api/books")
      .set("Authorization", token);
    console.log("Get Books Response:", res.body); // Debugging
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Ensure the server is closed after tests to prevent port conflicts
  afterAll(() => {
    server.close();
  });
});
