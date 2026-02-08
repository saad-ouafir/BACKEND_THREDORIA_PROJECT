// Import the needed modules
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");

// Import Errorhandling & API limiter Middlewares
const ErrorHandler = require("./middlewares/errorHandler.middleware");
const { apiLimiter } = require("./middlewares/rateLimit.middleware");
const { checkBlock } = require("./middlewares/rateLimit.middleware");

// Import
const router = require("./routers/index");

// HTTP traffic security
app.use(helmet());
app.use(
  cors({
    origin: ["https://threadoria.app", "https://www.threadoria.app"],
    methods: ["GET", "POST", "PUT", "UPDATE", "DELETE"],
    credentials: true,
  }),
);

// API configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Calling global routes + API Limiters Middlewares
router.use(checkBlock);
app.use("/api", apiLimiter, router);

// Error handling middleware
app.use(ErrorHandler.globalErrorHandler);
app.use(ErrorHandler.notFoundHandler);

module.exports = app;
