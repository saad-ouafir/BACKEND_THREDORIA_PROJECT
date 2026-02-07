const Joi = require("joi");

/**
 * Thread validation schemas using Joi
 * Provides robust data validation for thread endpoints
 */

// Create thread schema
const createThreadSchema = Joi.object({
  content: Joi.string().required().min(1).max(500).trim().messages({
    "string.empty": "Thread content is required",
    "any.required": "Thread content is required",
    "string.min": "Thread content cannot be empty",
    "string.max": "Thread content must not exceed 500 characters",
  }),

  parent_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": "Parent ID must be a number",
    "number.integer": "Parent ID must be an integer",
    "number.positive": "Parent ID must be a positive number",
  }),
});

// Search threads schema
const searchThreadsSchema = Joi.object({
  search: Joi.string().required().min(1).max(100).trim().messages({
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

// Thread ID parameter schema
const threadIdSchema = Joi.object({
  threadId: Joi.number().integer().positive().required().messages({
    "number.base": "Thread ID must be a number",
    "number.integer": "Thread ID must be an integer",
    "number.positive": "Thread ID must be a positive number",
    "any.required": "Thread ID is required",
  }),
});

// User ID parameter schema
const userIdSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
    "number.positive": "User ID must be a positive number",
    "any.required": "User ID is required",
  }),
});

// Parent ID parameter schema
const parentIdSchema = Joi.object({
  parentID: Joi.number().integer().positive().required().messages({
    "number.base": "Parent ID must be a number",
    "number.integer": "Parent ID must be an integer",
    "number.positive": "Parent ID must be a positive number",
    "any.required": "Parent ID is required",
  }),
});

// Pagination query schema
const paginationSchema = Joi.object({
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

module.exports = {
  createThreadSchema,
  searchThreadsSchema,
  threadIdSchema,
  userIdSchema,
  parentIdSchema,
  paginationSchema,
};
