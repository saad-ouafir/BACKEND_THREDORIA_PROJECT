const { Media, User } = require("../../models/index");
const { UploadHandler, DeleteHandler } = require("../../handlers/mediaHandler");
const { findUser } = require("../../utils/findUser");
class MediaController {
  // Profile Pictures
  static async uploadProfilePicture(req, res) {
    const userID = req.currentUser?.id;

    try {
      const user = await User.findByPk(userID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const oldProfilePictureUrl = user.profile_picture_url;
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      const newProfilePictureUrl = await UploadHandler(req.file, userID);
      await user.update({ profile_picture_url: newProfilePictureUrl });
      if (oldProfilePictureUrl) {
        DeleteHandler(oldProfilePictureUrl, userID).catch((err) => {
          console.error("Cleanup Error (Old Profile Pic):", err.message);
        });
      }

      // Fetch the updated user data
      const updatedUser = await User.findByPk(userID);
      const { userDataSanitizer } = require("../../utils/userDataSanitizer");

      return res.status(200).json({
        message: "Profile picture updated successfully",
        profile_picture_url: newProfilePictureUrl,
        user: userDataSanitizer(updatedUser),
      });
    } catch (error) {
      console.error("Upload controller error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async uploadThreadsMedia(req, res) {
    const userID = req.currentUser.id;
    const { threadID } = req.params;
    const { media_type = "IMAGE" } = req.body; // Default to 'IMAGE' if not provided
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    try {
      const mediaUrls = await UploadHandler(files, userID);

      // Create media records in database
      const mediaRecords = mediaUrls.map((media_url) => ({
        thread_id: threadID,
        media_type: media_type.toUpperCase(), // Ensure uppercase
        url: media_url,
      }));

      await Media.bulkCreate(mediaRecords);

      return res.status(200).json({
        message: "Media uploaded successfully",
        uploadedMedia: mediaUrls,
      });
    } catch (error) {
      console.error("Upload threads media error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getThreadMedia(req, res) {
    const { threadID } = req.params;

    try {
      const media = await Media.findAll({
        where: { thread_id: threadID },
        attributes: ["id", "media_type", "url", "created_at"],
        order: [["created_at", "ASC"]],
      });

      return res.status(200).json({
        message: "Media retrieved successfully",
        media: media,
      });
    } catch (error) {
      console.error("Get thread media error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async deleteProfilePicture(req, res) {
    const userID = req.currentUser?.id;

    try {
      const user = await User.findByPk(userID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldProfilePictureUrl = user.profile_picture_url;
      if (!oldProfilePictureUrl) {
        return res.status(400).json({ message: "No profile picture to delete" });
      }

      // Delete the file from storage
      await DeleteHandler(oldProfilePictureUrl, userID);

      // Update user record to remove profile picture URL
      await user.update({ profile_picture_url: null });

      // Fetch the updated user data
      const updatedUser = await User.findByPk(userID);
      const { userDataSanitizer } = require("../../utils/userDataSanitizer");

      return res.status(200).json({
        message: "Profile picture deleted successfully",
        user: userDataSanitizer(updatedUser),
      });
    } catch (error) {
      console.error("Delete profile picture error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async deleteThreadMedia(req, res) {
    const userID = req.currentUser.id;
    const { threadID } = req.params;

    try {
      // Find all media for this thread
      const mediaRecords = await Media.findAll({
        where: { thread_id: threadID },
      });

      if (mediaRecords.length === 0) {
        return res.status(404).json({ message: "No media found for this thread" });
      }

      // Delete files from storage
      const deletePromises = mediaRecords.map((media) =>
        DeleteHandler(media.url, userID).catch((err) => {
          console.error(`Failed to delete media ${media.id}:`, err.message);
        }),
      );

      await Promise.all(deletePromises);

      // Delete records from database
      await Media.destroy({
        where: { thread_id: threadID },
      });

      return res.status(200).json({
        message: "Thread media deleted successfully",
      });
    } catch (error) {
      console.error("Delete thread media error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = MediaController;
