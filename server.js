const { configReady } = require("./src/config/config");

// Global Error Handlers (catches all unhandled promise rejections)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", error => {
  console.error("Uncaught Exception:", error);
});

// Bootstrap the server
async function start() {
  // 1. Wait for secrets to load from GCP Secret Manager
  await configReady;

  // 2. Now import modules that depend on config values
  const app = require("./src/app");
  const http = require("http");
  const { Server } = require("socket.io");
  const { APP_PORT } = require("./src/config/config");
  const { connectDataBase } = require("./src/config/database");
  const { initializeSocket } = require("./src/config/socket");

  // 3. WebSocket + HTTP server configuration
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: ["https://threadoria.app", "https://www.threadoria.app"],
      methods: ["GET", "POST", "PUT", "UPDATE", "DELETE"],
      credentials: true,
    },
  });
  app.set("io", io);

  // Initialize WebSocket notification system
  initializeSocket(io);

  // 4. Start the HTTP + WebSocket server
  await connectDataBase();
  httpServer.listen(APP_PORT);
  console.log(`Server running on port ${APP_PORT}`);
}

start().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
