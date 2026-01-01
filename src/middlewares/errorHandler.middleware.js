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
        message: `An entry with the same ${error.errors[0]?.path} already exists`,
      });
    }

    if (error.name === "SequelizeConnectionError") {
      return res.status(503).json({
        message: "Database connection error",
      });
    }

    // Handle JWT errors
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Authentication error",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: error.errors[0].message,
      });
    }

    // Default error
    return res.status(500).json({
      message: "Internal server error",
    });
  };

  static notFoundHandler = (req, res) => {
    return res.status(404).json({
      message: "Undefined Route !",
    });
  };
}

module.exports = ErrorHandler;
