const { User } = require("../../models/index");
const bcrypt = require("bcrypt");
const RefreshTokenController = require("./refreshToken.controller");
const { findUser } = require("../../utils/findUser");
const { userDataSanitizer } = require("../../utils/userDataSanitizer");

class UserController {
  static async register(req, res) {
    const { email, username, full_name, password, is_private, profile_picture_url, profile_metadata, bio } = req.body;

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
    const refreshToken = await RefreshTokenController.generateRefreshToken(user.id);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: userDataSanitizer(user),
      accessToken,
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const user = await findUser(req, res, email, "Invalid mail or password !");
    if (!user) {
      return;
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = RefreshTokenController.generateAccessToken(user.id);

    const refreshToken = await RefreshTokenController.generateRefreshToken(user.id);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({
      message: "Login successful",
      user: userDataSanitizer(user),
      accessToken,
    });
  }

  static async logout(req, res) {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Find and delete the refresh token from database
      const tokenData = await RefreshTokenController.validateRefreshToken(refreshToken);
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

    const tokenData = await RefreshTokenController.validateRefreshToken(refreshToken);
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
      user: userDataSanitizer(user),
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
    const id = req.currentUser.id;
    const { email, username, full_name, is_private, profile_picture_url, profile_metadata, bio } = req.body;

    // Check if user exists using findUser utility
    const user = await findUser(req, res, id, "User not found");
    if (!user) {
      return;
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      return await findUser(req, res, email, "Email is already taken");
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      return await findUser(req, res, username, "Username is already taken");
    }

    await User.update(
      {
        username: username || user.username,
        full_name: full_name || user.full_name,
        email: email || user.email,
        is_private: is_private !== undefined ? is_private : user.is_private,
        profile_picture_url: profile_picture_url !== undefined ? profile_picture_url : user.profile_picture_url,
        profile_metadata: profile_metadata !== undefined ? profile_metadata : user.profile_metadata,
        bio: bio !== undefined ? bio : user.bio,
      },
      { where: { id: parseInt(id) } }
    );

    return res.status(200).json({
      message: "User updated successfully",
      user: userDataSanitizer(user),
    });
  }

  static async delete(req, res) {
    const id = req.currentUser.id;
    await RefreshTokenController.deleteRefreshTokens(id);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    const user = await findUser(req, res, id);
    await User.destroy({ where: { id: user.id } });
    return res.status(200).json({ message: "User deleted successfully" });
  }
}

module.exports = UserController;
