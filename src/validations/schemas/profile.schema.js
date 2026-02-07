const Joi = require("joi");

/**
 * Profile validation schemas using Joi
 * Provides robust data validation for profile endpoints
 */

// Search profiles schema
const searchProfilesSchema = Joi.object({
  q: Joi.string().required().min(1).max(100).trim().messages({
    "string.empty": "Search query is required",
    "any.required": "Search query is required",
    "string.min": "Search query cannot be empty",
    "string.max": "Search query must not exceed 100 characters",
  }),

  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 100",
  }),
});

// Suggest profiles schema
const suggestProfilesSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 50",
  }),

  cursor: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": "Cursor must be a number",
    "number.integer": "Cursor must be an integer",
    "number.positive": "Cursor must be a positive number",
  }),

  exclude: Joi.string()
    .pattern(/^(\d+,)*\d+$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Exclude must be a comma-separated list of IDs",
    }),
});

// Profile ID parameter schema
const profileIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Profile ID must be a number",
    "number.integer": "Profile ID must be an integer",
    "number.positive": "Profile ID must be a positive number",
    "any.required": "Profile ID is required",
  }),
});

module.exports = {
  searchProfilesSchema,
  suggestProfilesSchema,
  profileIdSchema,
};
