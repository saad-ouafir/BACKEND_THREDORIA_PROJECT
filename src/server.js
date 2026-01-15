const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { NotificationMiddleware } = require("./middlewares/notification.middleware");
const server = express();
const routes = require("./routers/index");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { apiLimiter } = require("./middlewares/rateLimit.middleware");

const { APP_PORT } = require("./config/config") || 5000;
const { connectDataBase } = require("./config/database");

// Create HTTP server for Socket.IO
const httpServer = http.createServer(server);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup Socket.IO connection handling
NotificationMiddleware.setupSocketIO(io);

// Setup event listeners for notifications
NotificationMiddleware.setupEventListeners();

// Make io available to controllers
server.set('io', io);

httpServer.listen(APP_PORT, () => {
  console.log(`Server running on port ${APP_PORT}`);
});

connectDataBase();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser());
server.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

server.use(morgan("dev"));

// Apply general rate limiting to all API routes
server.use(apiLimiter);

// Routes
server.use("/api", routes);

module.exports = server;
