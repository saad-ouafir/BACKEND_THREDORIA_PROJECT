const { Thread } = require("../../models/index");
const { findThread } = require("../../utils/findThread");
class ThreadController {
  static async getThreadsByUserID(req, res) {
    const { userId } = req.params;
    return await findThread((res = res), (userId = userId));
  }

  // Get Sub Threads
  static async getSubThreads(req, res) {
    const pi = req.params.parentID;
    return await findThread((res = res), (parentID = pi));
  }

  // Get Thread By ID
  static async getThreadById(req, res) {
    const ti = req.params.threadId;
    return await findThread((res = res), (threadId = ti));
  }

  // Create Thread
  static async createThread(req, res) {
    const { content, parent_id } = req.body;
    const author_id = req.currentUser.id;
    await Thread.create({
      content,
      author_id,
      parent_id: parent_id || null,
    });

    return res.status(201).json({
      message: "Thread created successfully",
    });
  }

  static async deleteThreadById(req, res) {
    const { id } = req.params;
    const deletedThread = await Thread.destroy({ where: { id: id } });
    if (!deletedThread) {
      return res.status(404).json({ message: "Thread not found" });
    }
    return res.status(200).json({ message: "Thread deleted successfully" });
  }

  static async searchThreads(req, res) {
    const { search } = req.query;
  }

  static async suggestThreadByTag() {}
}

module.exports = ThreadController;
