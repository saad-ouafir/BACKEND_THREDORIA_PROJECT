const server = require("./src/server");
const ErrorHandler = require("./src/middlewares/errorHandler.middleware");

// Enabling Helmet
const helmet = require("helmet");
server.use(helmet());

// Error handling middleware
server.use(ErrorHandler.globalErrorHandler);
server.use(ErrorHandler.notFoundHandler);
