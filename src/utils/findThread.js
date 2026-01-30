const { Thread, Media, User, Reaction } = require("../models/index");

async function findThreads(
  res,
  uid = null,
  threadId = null,
  parentID = null,
  limit = 10,
  offset = 0,
  currentUserId = null,
) {
  const whereClause = {};
  if (uid) {
    whereClause.author_id = uid;
  }
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
      attributes: ["id", "username", "full_name", "profile_picture_url", "is_private"],
    },
    {
      model: Media,
      as: "media",
      required: false,
      attributes: ["id", "url", "media_type"],
      separate: true,
    },
    ...(currentUserId
      ? [
          {
            model: Reaction,
            as: "reactions",
            required: false,
            where: {
              type: "LIKE",
              user_id: currentUserId,
            },
            attributes: ["id", "type", "user_id"],
          },
        ]
      : []),
  ];

  const queryOptions = {
    ...(Object.keys(whereClause).length > 0 && { where: whereClause }),
    include: includeOptions,
    order: [["created_at", "DESC"]],
    limit,
    offset,
  };

  const result = threadId ? await Thread.findByPk(threadId, queryOptions) : await Thread.findAll(queryOptions);

  if (!result || (Array.isArray(result) && result.length === 0)) {
    if (threadId) {
      res.status(404).json({ message: "Thread does not exist!" });
      return null;
    }
    return [];
  }

  // Add isLiked boolean
  const addIsLiked = (thread) => {
    const isLiked = thread.reactions && thread.reactions.length > 0;
    return {
      ...thread.toJSON(),
      isLiked,
    };
  };

  if (Array.isArray(result)) {
    return result.map(addIsLiked);
  } else {
    return addIsLiked(result);
  }
}

async function findThread(res, threadId, currentUserId = null) {
  if (!threadId) {
    res.status(400).json({ message: "Thread ID is required" });
    return null;
  }

  const thread = await Thread.findByPk(threadId, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "username", "full_name", "profile_picture_url"],
      },
      {
        model: Thread,
        as: "replies",
        required: false,
        separate: true,
        limit: 20,
        order: [["created_at", "ASC"]],
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username", "full_name", "profile_picture_url"],
          },
          {
            model: Media,
            as: "media",
            required: false,
            attributes: ["id", "url", "media_type"],
            separate: true,
          },
          ...(currentUserId
            ? [
                {
                  model: Reaction,
                  as: "reactions",
                  required: false,
                  where: {
                    type: "LIKE",
                    user_id: currentUserId,
                  },
                  attributes: ["id", "type", "user_id"],
                },
              ]
            : []),
        ],
      },
      {
        model: Media,
        as: "media",
        required: false,
        attributes: ["id", "url", "media_type"],
        separate: true,
      },
      ...(currentUserId
        ? [
            {
              model: Reaction,
              as: "reactions",
              required: false,
              where: {
                type: "LIKE",
                user_id: currentUserId,
                thread_id: threadId,
              },
              attributes: ["id", "type", "user_id"],
            },
          ]
        : []),
    ],
  });

  if (!thread) {
    res.status(404).json({ message: "Thread does not exist!" });
    return null;
  }

  // Add isLiked to thread and replies
  const threadData = thread.toJSON();
  threadData.isLiked = thread.reactions && thread.reactions.length > 0;
  if (threadData.replies) {
    threadData.replies = threadData.replies.map((reply) => ({
      ...reply,
      isLiked: reply.reactions && reply.reactions.length > 0,
    }));
  }

  return threadData;
}

module.exports = { findThread, findThreads };
