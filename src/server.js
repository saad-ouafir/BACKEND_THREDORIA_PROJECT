const express = require("express");
const server = express();
const routes = require("./routers/index");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { apiLimiter } = require("./middlewares/rateLimit.middleware");

const { APP_PORT, FRONTEND_APP_PORT } = require("./config/config") || 5000;
const { connectDataBase } = require("./config/database");

server.listen(APP_PORT, () => {
  console.log(`Server running on port ${APP_PORT}`);
});

connectDataBase();
server.use(express.json());

server.use(express.urlencoded({ extended: true }));
server.use(cookieParser());
server.use(
  cors({
    origin: FRONTEND_APP_PORT || 3000,
    credentials: true,
  })
);

server.use(morgan("dev"));

// Apply general rate limiting to all API routes
server.use("/api", apiLimiter, routes);

module.exports = server;
