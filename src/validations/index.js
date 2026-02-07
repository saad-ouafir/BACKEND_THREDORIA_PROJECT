/**
 * Validation module index
 * Exports all validation schemas and middleware
 */

// Middleware
const { validateBody, validateQuery, validateParams, validate } = require("./validate.middleware");

// Schemas
const authSchemas = require("./schemas/auth.schema");
const threadSchemas = require("./schemas/thread.schema");
const followSchemas = require("./schemas/follow.schema");
const profileSchemas = require("./schemas/profile.schema");

module.exports = {
  // Middleware
  validateBody,
  validateQuery,
  validateParams,
  validate,

  // Auth schemas
  ...authSchemas,

  // Thread schemas
  ...threadSchemas,

  // Follow schemas
  ...followSchemas,

  // Profile schemas
  ...profileSchemas,
};
