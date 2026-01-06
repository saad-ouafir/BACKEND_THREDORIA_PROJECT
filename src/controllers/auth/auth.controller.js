const { User } = require("../../models/index");
const bcrypt = require("bcrypt");
const RefreshTokenController = require("./refreshToken.controller");
const { findUser } = require("../../utils/findUser");

class UserController {
  static async register(req, res) {
    const {
      email,
      username,
      full_name,
      password,
      is_private,
      profile_picture_url,
      profile_metadata,
      bio,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      full_name,
      email,
      password_hash: hashedPassword,
      is_private: is_private || false,
      profile_picture_url: profile_picture_url || null,
      profile_metadata: profile_metadata || null,
      bio: bio || null,
    });

    const accessToken = RefreshTokenController.generateAccessToken(user.id);
    const refreshToken = await RefreshTokenController.generateRefreshToken(
      user.id
    );

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        is_private: user.is_private,
        profile_picture_url: user.profile_picture_url,
        profile_metadata: user.profile_metadata,
        bio: user.bio,
        follower_count: user.follower_count,
        following_count: user.following_count,
      },
      accessToken,
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const user = await findUser(req, res, email, "Invalid mail or password !");
    if (!user || res.headersSent) {
      return;
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = RefreshTokenController.generateAccessToken(user.id);

    const refreshToken = await RefreshTokenController.generateRefreshToken(
      user.id
    );

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        is_private: user.is_private,
        profile_picture_url: user.profile_picture_url,
        profile_metadata: user.profile_metadata,
        bio: user.bio,
        follower_count: user.follower_count,
        following_count: user.following_count,
        createdAt: user.createdAt
      },
      accessToken,
    });
  }

  static async logout(req, res) {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Find and delete the refresh token from database
      const tokenData = await RefreshTokenController.validateRefreshToken(
        refreshToken
      );
      if (tokenData) {
        await RefreshTokenController.deleteRefreshTokens(tokenData.user_id);
      }
    }

    // Clear the HTTP-only cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  }

  static async refresh(req, res) {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    const tokenData = await RefreshTokenController.validateRefreshToken(
      refreshToken
    );
    if (!tokenData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findByPk(tokenData.user_id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = RefreshTokenController.generateAccessToken(user.id);

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        is_private: user.is_private,
        profile_picture_url: user.profile_picture_url,
        profile_metadata: user.profile_metadata,
        bio: user.bio,
        follower_count: user.follower_count,
        following_count: user.following_count,
      },
    });
  }

  static async resetPassword(req, res) {
    const { email, newPassword } = req.body;
    const user = await findUser(req, res, email);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashedPassword });
    return res.status(200).json({ message: "Password reset successfully" });
  }

  static async update(req, res) {
    const {
      email,
      username,
      full_name,
      is_private,
      profile_picture_url,
      profile_metadata,
      bio,
    } = req.body;
    await findUser(req, res, email);
    const user = await User.update(
      {
        username,
        full_name,
        email,
        is_private: is_private || false,
        profile_picture_url: profile_picture_url || null,
        profile_metadata: profile_metadata || null,
        bio: bio || null,
      },
      { where: { email: email } }
    );
    return res.status(200).json({ message: "User updated successfully", user });
  }

  static async delete(req, res) {
    const { id } = req.params;
    const user = await findUser(req, res, id);
    await User.destroy({ where: { id: user.id } });
    await RefreshTokenController.deleteRefreshTokens(id);
    return res.status(200).json({ message: "User deleted successfully" });
  }
}

module.exports = UserController;
