const { User } = require("../../models/index");
const bcrypt = require("bcrypt");
const RefreshTokenController = require("./refreshToken.controller");
const { findUser } = require("../../utils/findUser");

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
      user.id
    );
    const refreshToken = await RefreshTokenController.generateRefreshToken(
      user.id
    );

    return res.status(201).json({
      message: "User registered successfully",
      user,
      accessToken,
      refreshToken,
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const user = await findUser(req, res, email, "Invalid mail or password !");
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
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
      message: "Login successful",
      user,
      accessToken,
      refreshToken,
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
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findByPk(tokenData.user_id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = await RefreshTokenController.generateAccessToken(
      user.id,
      user.email
    );

    return res.status(200).json({ accessToken: newAccessToken });
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
      is_private,
      profile_picture_url,
      profile_picture_cdn,
      profile_picture_provider,
      bio,
    } = req.body;
    await findUser(req, res, email);
    const user = await User.update(
      {
        username,
        email,
        is_private: is_private || false,
        profile_picture_url: profile_picture_url || null,
        profile_picture_cdn: profile_picture_cdn || null,
        profile_picture_provider: profile_picture_provider || null,
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
