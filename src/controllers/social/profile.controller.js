const { where } = require("sequelize");
const { User } = require("../../models/index");

class ProfileController {
  static async getProfiles(req, res) {
    const users = await User.findAll();
    return res.status(200).json({ message: users });
  }

  static async getProfilebyID(req, res) {
    const { id } = req.params;
    const user = await User.findOne({ where: { id: req.params.id } });
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }
  }

  static async resetPassword(req, res) {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashedPassword });
    await RefreshTokenController.deleteUserRefreshTokens(user.id);
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
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json("User Not Found");
    }
    await User.update(
      {
        username,
        email,
        password_hash: hashedPassword,
        is_private: is_private || false,
        profile_picture_url: profile_picture_url || null,
        profile_picture_cdn: profile_picture_cdn || null,
        profile_picture_provider: profile_picture_provider || null,
        bio: bio || null,
      },
      { where: { email: email } }
    );
    return res.status(200).json("User updated successfully");
  }

  static async delete(req, res) {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    await RefreshTokenController.deleteRefreshTokens(id);
    return res.status(200).json("User deleted successfully");
  }
}

module.exports = ProfileController;
