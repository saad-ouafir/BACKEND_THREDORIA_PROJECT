const Joi = require("joi");

// Toggle follow schema
const toggleFollowSchema = Joi.object({
  followingId: Joi.number().integer().positive().required().messages({
    "number.base": "Following ID must be a number",
    "number.integer": "Following ID must be an integer",
    "number.positive": "Following ID must be a positive number",
    "any.required": "Following ID is required",
  }),
});

// Accept/Reject follow request schema
const followRequestSchema = Joi.object({
  followerID: Joi.number().integer().positive().required().messages({
    "number.base": "Follower ID must be a number",
    "number.integer": "Follower ID must be an integer",
    "number.positive": "Follower ID must be a positive number",
    "any.required": "Follower ID is required",
  }),
});

// Remove follower schema
const removeFollowerSchema = Joi.object({
  followerId: Joi.number().integer().positive().required().messages({
    "number.base": "Follower ID must be a number",
    "number.integer": "Follower ID must be an integer",
    "number.positive": "Follower ID must be a positive number",
    "any.required": "Follower ID is required",
  }),
});

// User ID parameter schema
const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
    "number.positive": "User ID must be a positive number",
    "any.required": "User ID is required",
  }),
});

// Pagination query schema for followers/following
const followPaginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 100",
  }),

  offset: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Offset must be a number",
    "number.integer": "Offset must be an integer",
    "number.min": "Offset cannot be negative",
  }),
});

module.exports = {
  toggleFollowSchema,
  followRequestSchema,
  removeFollowerSchema,
  userIdParamSchema,
  followPaginationSchema,
};
