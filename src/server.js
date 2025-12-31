const express = require("express");
const server = express();
const routes = require("./routers/index");
const cors = require("cors");

const { APP_PORT } = require("./config/config") || 5000;
const { connectDataBase } = require("./config/database");

server.listen(APP_PORT, () => {
  console.log(`Server running on port ${APP_PORT}`);
});

connectDataBase();
server.use(express.json());
server.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Public routes (without Auth)
server.use("/api/auth", routes.authRoutes);

// Protected routes (with Auth)
server.use("/api/auth", routes.protectedRoutes);

module.exports = server;
