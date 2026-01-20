class ErrorHandler {
  static handleAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static wrapController(controller) {
    return Object.fromEntries(
      Object.getOwnPropertyNames(controller)
        .filter((method) => typeof controller[method] === "function")
        .map((method) => [method, ErrorHandler.handleAsync(controller[method].bind(controller))])
    );
  }

  static globalErrorHandler = (error, req, res, next) => {
    console.log(error);
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

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Data validation error",
      });
    }

    // Default error
    return res.status(500).json({
      message: "Internal server error",
    });
  };

  // Undefined route
  static notFoundHandler = (req, res) => {
    return res.status(404).json({
      message: "Error 404, Undefined Route !",
    });
  };
}

module.exports = ErrorHandler;
