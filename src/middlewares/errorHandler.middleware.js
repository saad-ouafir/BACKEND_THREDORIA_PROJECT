class ErrorHandler {
  static handleAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static globalErrorHandler = (error, req, res, next) => {
    // Sequelize errors
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        status: 409,
        message: `An entry with the same ${error.errors[0]?.path} already exists`,
      });
    }

    if (error.name === "SequelizeConnectionError") {
      return res.status(503).json({
        status: 503,
        message: "Database connection error",
      });
    }

    //   // General Sequelize errors
    //   return res.status(500).json({
    //     error: "Un operation failed",
    //   });

    // Handle JWT errors
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Authentication error",
      });
    }

    // // Handle custom application errors with status
    // if (error.status) {
    //   return res.status(error.status).json({
    //     status: error.status,
    //     message: error.message,
    //   });
    // }

    // // Handle specific auth errors
    // if (error.message === "Invalid refresh token") {
    //   return res.status(401).json({
    //     status: 401,
    //     message: "Invalid refresh token",
    //   });
    // }

    // if (error.message === "User not found") {
    //   return res.status(401).json({
    //     status: 401,
    //     message: "User not found",
    //   });
    // }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        status: 400,
        message: error.errors[0].message,
      });
    }

    // Default error
    res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
    });
  };

  static notFoundHandler = (req, res) => {
    res.status(404).json({
      error: `Route ${req.originalUrl} not found`,
    });
  };
}

module.exports = ErrorHandler;
