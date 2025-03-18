const http = require("http");

// Define the API endpoint to test
const options = {
  hostname: "127.0.0.1", // Use IPv4 instead of IPv6 (::1)
  port: 5000,
  path: "/api/books",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};


// Send the request
const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response from API:", data);
    process.exit(0); // Exit script when done
  });
});

req.on("error", (error) => {
  console.error("Error:", error);
  process.exit(1); // Exit with error
});

req.end();


