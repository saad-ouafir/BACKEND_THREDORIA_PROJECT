const Joi = require("joi");

/**
 * Authentication validation schemas using Joi
 * Provides robust data validation for authentication endpoints
 */

// Common validation patterns
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;

// Register schema
const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .max(255)
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
      "string.max": "Email must not exceed 255 characters",
    }),

  username: Joi.string().pattern(usernamePattern).required().min(3).max(50).messages({
    "string.pattern.base": "Username can only contain letters, numbers, and underscores (3-30 characters)",
    "string.empty": "Username is required",
    "any.required": "Username is required",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must not exceed 50 characters",
  }),

  full_name: Joi.string().required().min(2).max(100).trim().messages({
    "string.empty": "Full name is required",
    "any.required": "Full name is required",
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must not exceed 100 characters",
  }),

  password: Joi.string().required().min(8).max(128).pattern(passwordPattern).messages({
    "string.pattern.base": "Password must contain at least 8 characters, one uppercase, one lowercase, and one number",
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password must not exceed 128 characters",
  }),

  is_private: Joi.boolean().default(false).messages({
    "boolean.base": "is_private must be a boolean value",
  }),

  profile_picture_url: Joi.string().uri().max(500).allow(null, "").optional().messages({
    "string.uri": "Profile picture must be a valid URL",
    "string.max": "Profile picture URL must not exceed 500 characters",
  }),

  profile_metadata: Joi.object().allow(null).optional(),

  bio: Joi.string().max(160).allow(null, "").optional().messages({
    "string.max": "Bio must not exceed 160 characters",
  }),
});

// Login schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

// Update profile schema
const updateProfileSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .optional()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.max": "Email must not exceed 255 characters",
    }),

  username: Joi.string().pattern(usernamePattern).min(3).max(50).optional().messages({
    "string.pattern.base": "Username can only contain letters, numbers, and underscores (3-30 characters)",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must not exceed 50 characters",
  }),

  full_name: Joi.string().min(2).max(100).trim().optional().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must not exceed 100 characters",
  }),

  is_private: Joi.boolean().optional().messages({
    "boolean.base": "is_private must be a boolean value",
  }),

  profile_picture_url: Joi.string().uri().max(500).allow(null, "").optional().messages({
    "string.uri": "Profile picture must be a valid URL",
    "string.max": "Profile picture URL must not exceed 500 characters",
  }),

  profile_metadata: Joi.object().allow(null).optional(),

  bio: Joi.string().max(160).allow(null, "").optional().messages({
    "string.max": "Bio must not exceed 160 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

// Password reset schema
const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  newPassword: Joi.string().required().min(8).max(128).pattern(passwordPattern).messages({
    "string.pattern.base": "Password must contain at least 8 characters, one uppercase, one lowercase, and one number",
    "string.empty": "New password is required",
    "any.required": "New password is required",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password must not exceed 128 characters",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  resetPasswordSchema,
};
