const { Thread, Media, User } = require("../models/index");
async function findThread(res, userId = null, threadId = null, parentID = null) {
  const includeOptions = [
    {
      model: User,
      as: "author",
      attributes: ["id", "username", "email"],
      required: false,
      where: {
        id: userId || null,
      },
    },
    {
      model: Thread,
      as: "threads",
      required: false,
      where: {
        parent_id: parentID || null,
      },
    },
    {
      model: Media,
      as: "media",
      required: false,
    },
  ];

  if (threadId) {
    const thread = await Thread.findByPk(threadId, {
      include: includeOptions,
    });
    if (!thread) {
      res.status(404).json({ message: "Thread does not exist !" });
      return;
    }
    return thread;
  }

  const threads = await Thread.findAll({
    include: includeOptions,
  });
  if (!threads) {
    res.status(404).json({ message: "Threads does not exist !" });
    return;
  }
  return threads;
}

module.exports = { findThread };
