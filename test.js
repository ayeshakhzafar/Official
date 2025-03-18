name: Node.js CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Create .env file
        run: |
          echo "PORT=5000" >> .env
          echo "JWT_SECRET=mysecretkey" >> .env

      - name: Run tests
        run: npm test  # ✅ Use npm test instead of node test.js

