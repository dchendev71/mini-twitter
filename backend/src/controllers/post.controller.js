import prisma from "../prismaClient.js";
import logger from "../utils/logger.js";
import { REDIS_POST_PATH } from "../redisClient.js";

async function createPost(req, res) {
  try {
    const { content } = req.body;
    if (!content || content.trim() === "") {
      return res.status(403).json({ message: "post content cannot be empty" });
    }

    const post = await prisma.post.create({
      data: {
        authorId: req.user.id,
        text: content,
      },
      include: {
        author: true,
      },
    });

    const ts = Date.now();

    const redis = req.app.locals.redis;
    const fanoutQueue = req.app.locals.fanoutQueue;

    await redis.zadd(REDIS_POST_PATH + `${req.user.id}`, ts, post.id);

    await fanoutQueue.add("fanoutPost", {
      postId: post.id,
      authorId: req.user.id,
      ts,
    });

    return res.status(201).json({
      message: "post created succesfully",
      post,
    });
  } catch (err) {
    logger.error("Error creating post:", err);
    return res.status(500).json({
      message: "failed to create post",
    });
  }
}

async function getTimeline(req, res) {
  try {
    const userId = req.user.id;
    const limit = Math.min(20, Number(req.query.limit) || 10);

    const redis = req.app.locals.redis;
    const ids = await redis.zrevrange(
      REDIS_POST_PATH + `${userId}`,
      0,
      limit - 1,
    );
    let posts = [];
    if (ids.length > 0) {
      posts = await prisma.post.findMany({
        where: {
          id: {
            in: ids.map(Number),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      posts = await prisma.post.findMany({
        where: {
          authorId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });
    }
    return res.status(201).json({ posts });
  } catch (err) {
    logger.error("Error fetching timeline:", err);
    return res.status(500).json({ error: "Could not fetch timeline" });
  }
}
export { createPost, getTimeline };
