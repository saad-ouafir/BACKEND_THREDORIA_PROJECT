const { RefreshToken } = require("../../models/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

class RefreshTokenController {
  static async generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });
  }

  static async generateRefreshToken(userId) {
    try {
      const token = uuidv4();
      const tokenHash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      await RefreshToken.create({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      return token;
    } catch (error) {
      throw new Error("Failed to generate refresh token");
    }
  }

  static async validateRefreshToken(token) {
    try {
      const refreshTokens = await RefreshToken.findAll();

      for (const refreshToken of refreshTokens) {
        const isValid = await bcrypt.compare(token, refreshToken.token_hash);
        if (isValid && refreshToken.expires_at > new Date()) {
          return refreshToken;
        }
      }

      return null;
    } catch (error) {
      throw new Error("Failed to validate refresh token");
    }
  }

  static async deleteRefreshTokens(userId) {
    await RefreshToken.destroy({ where: { user_id: userId } });
    // return
  }
}

module.exports = RefreshTokenController;
