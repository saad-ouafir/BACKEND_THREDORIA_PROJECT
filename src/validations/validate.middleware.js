const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      convert: true, // Type coercion
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    // Replace body with validated and sanitized data
    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    req.query = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    req.params = value;
    next();
  };
};

const validate = (schemas = {}) => {
  return (req, res, next) => {
    const allErrors = [];

    // Validate body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        allErrors.push(
          ...error.details.map((detail) => ({
            location: "body",
            field: detail.path.join("."),
            message: detail.message,
          })),
        );
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        allErrors.push(
          ...error.details.map((detail) => ({
            location: "query",
            field: detail.path.join("."),
            message: detail.message,
          })),
        );
      } else {
        req.query = value;
      }
    }

    // Validate params
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        allErrors.push(
          ...error.details.map((detail) => ({
            location: "params",
            field: detail.path.join("."),
            message: detail.message,
          })),
        );
      } else {
        req.params = value;
      }
    }

    if (allErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: allErrors,
      });
    }

    next();
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  validate,
};
