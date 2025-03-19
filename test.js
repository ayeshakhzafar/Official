const http = require("http");

const options = {
  hostname: "127.0.0.1",
  port: 5000,
  path: "/api/books",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  let data = "";
  
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Get All Books Response:", data);
    process.exit(0); 
  });
});

req.on("error", (error) => {
  console.error("Error:", error.message);
  process.exit(1);
});

req.end();
