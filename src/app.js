// Import the needed modules
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");

// Import Errorhandling & API limiter Middlewares
const ErrorHandler = require("./middlewares/errorHandler.middleware");
// const { apiLimiter } = require("./middlewares/rateLimit.middleware");
// const { checkBlock } = require("./middlewares/rateLimit.middleware");

// Import
const { FRONTEND_SERVER_URL } = require("./config/config");
const router = require("./routers/index");

// HTTP traffic security
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_SERVER_URL,
    methods: ["GET", "POST", "PUT", "UPDATE", "DELETE"],
    credentials: true,
  }),
);

// API configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Callign global routes + API Limitters Middlewares
// router.use(checkBlock);
// app.use("/api", apiLimiter, router);
app.use("/api", router);

// Error handling middleware
app.use(ErrorHandler.globalErrorHandler);
app.use(ErrorHandler.notFoundHandler);

module.exports = app;
