// import app after applying middlewares + Needed Modules
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

// Import Configuration + Database
const { APP_PORT, FRONTEND_SERVER_URL } = require("./src/config/config");
const { connectDataBase } = require("./src/config/database");

// Global Error Handlers (catches all unhandled promise rejections)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// WebSocket + HTTP server configuration
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_SERVER_URL,
    methods: ["GET", "POST", "PUT", "UPDATE", "DELETE"],
    credentials: true,
  },
});
app.set("io", io);

// Start the HTTP +WebSocket server
try {
  httpServer.listen(APP_PORT);
  connectDataBase();
  console.log(`Server running on port ${APP_PORT}`);
} catch (error) {
  console.error("Failed to start server:", error);
}
