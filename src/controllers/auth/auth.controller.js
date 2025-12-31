const { User } = require("../../models/index");
const bcrypt = require("bcrypt");
const RefreshTokenController = require("./refreshToken.controller");

class UserController {
  static async register(req, res) {
    const {
      email,
      username,
      password,
      is_private,
      profile_picture_url,
      profile_picture_cdn,
      profile_picture_provider,
      bio,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      is_private: is_private || false,
      profile_picture_url: profile_picture_url || null,
      profile_picture_cdn: profile_picture_cdn || null,
      profile_picture_provider: profile_picture_provider || null,
      bio: bio || null,
    });

    const accessToken = await RefreshTokenController.generateAccessToken(
      user.id,
      user.email
    );
    const refreshToken = await RefreshTokenController.generateRefreshToken(
      user.id
    );

    return res.status(201).json({
      status: 201,
      message: "User registered successfully",
      accessToken,
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }

    const accessToken = await RefreshTokenController.generateAccessToken(
      user.id
    );

    const refreshToken = await RefreshTokenController.generateRefreshToken(
      user.id
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      accessToken,
    });
  }

  static async logout(req, res) {
    const { id } = req.params;
    await RefreshTokenController.deleteRefreshTokens(id);
    return res.status(200).json({ message: "Logged out successfully" });
  }

  static async refresh(req, res) {
    const { refreshToken } = req.body;
    const tokenData = await RefreshTokenController.validateRefreshToken(
      refreshToken
    );
    if (!tokenData) {
      const error = new Error("Invalid refresh token");
      error.status = 401;
      throw error;
    }

    const user = await User.findByPk(tokenData.user_id);
    if (!user) {
      const error = new Error("User not found");
      error.status = 401;
      throw error;
    }

    const newAccessToken = await RefreshTokenController.generateAccessToken(
      user.id,
      user.email
    );

    return res.status(200).json({ accessToken: newAccessToken });
  }
}

module.exports = UserController;
