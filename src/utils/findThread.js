const { Thread, Media, User } = require("../models/index");

async function findThreads(res, uid = null, threadId = null, parentID = null, limit = 10, offset = 0) {
  const whereClause = {};
  if (threadId) {
    whereClause.id = threadId;
  }
  if (parentID !== null) {
    whereClause.parent_id = parentID;
  }

  const includeOptions = [
    {
      model: User,
      as: "author",
      attributes: ["id", "username", "email"],
      required: !!uid,
      ...(uid && { where: { id: uid } }),
    },
    {
      model: Thread,
      as: "replies",
      required: false,
      ...(parentID !== null && { where: { parent_id: parentID } }), // Fixed: only add where if exists
      separate: true,
      limit: 10,
    },
    {
      model: Media,
      as: "media",
      required: false,
      attributes: ["id", "url", "media_type"],
      separate: true,
    },
  ];

  const queryOptions = {
    ...(Object.keys(whereClause).length > 0 && { where: whereClause }), // Fixed: only add where if exists
    include: includeOptions,
    order: [["created_at", "DESC"]],
    limit,
    offset,
    subQuery: false,
  };

  const result = threadId ? await Thread.findByPk(threadId, queryOptions) : await Thread.findAll(queryOptions);

  if (!result || (Array.isArray(result) && result.length === 0)) {
    if (threadId) {
      res.status(404).json({ message: "Thread does not exist!" });
      return null; // Fixed: must return null for consistency
    }
    return [];
  }

  return result; // Fixed: was missing return statement
}

async function findThread(res, threadId) {
  if (!threadId) {
    res.status(400).json({ message: "Thread ID is required" });
    return null; // Fixed: must return null
  }

  const thread = await Thread.findByPk(threadId, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "username", "email"],
      },
      {
        model: Thread,
        as: "replies",
        required: false,
        separate: true,
        limit: 20,
        order: [["created_at", "ASC"]], // Fixed: order belongs inside separate include
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username", "full_name"],
          },
        ],
      },
      {
        model: Media,
        as: "media",
        required: false,
        attributes: ["id", "url", "media_type"],
        separate: true,
      },
    ],
  });

  if (!thread) {
    res.status(404).json({ message: "Thread does not exist!" });
    return null; // Fixed: must return null
  }

  return thread;
}

module.exports = { findThread, findThreads };
