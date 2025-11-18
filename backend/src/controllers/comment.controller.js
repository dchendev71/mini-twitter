import prisma from "../prismaClient.js"
import logger from "../utils/logger.js"

import { REDIS_POST_COMMENTS_PATH } from "../redisClient.js"

async function addComment(req, res) {
    try {
        const userId = req.user.id
        const postId = parseInt(req.params.postId, 10)
        const text = req.body
        const redis = req.app.locals.redis

        if (!text || text.trim() === "") {
            return res.status(400).json({ message: "Comment cannot be empty"})
        }

        const comment = await prisma.post.create({
            data: {
                authorId: userId,
                text: text,
                commentOfId: postId,
            },
            include: { author: true }
        })

        await redis.zadd(REDIS_POST_COMMENTS_PATH + postId, Date.now(), comment.id)

        return res.status(201).json({ comment })
    } catch (err) {
        logger.error("Error creating comment:", err);
        return res.status(500).json({ message: "Failed to create comment" });
    }
}

async function getComments(req, res) {
    try {
        const postId = parseInt(req.params.postId, 10)
        const redis = req.app.locals.redis
        const limit = Math.min(20, Number(req.query.limit) || 10);

        const ids = await redis.zrevrange(
            REDIS_POST_COMMENTS_PATH + postId, 0, limit - 1
        );

        let comments = [];

        if (ids.length > 0) {
            comments = await prisma.post.findMany({
                where: {
                    id: {
                        in: ids.map(Number)
                    }
                }, 
                include: { author: true },
                orderBy: { createdAt: "desc" }
            })
        } else {
            comments = await prisma.post.findMany({
                where: { commentOfId: postId },
                include: { author: true },
                orderBy: { createdAt: "desc" },
                take: limit
            })
            // Write to redis cache
            const pipeline = redis.multi();
            comments.forEach(comment => {
                pipeline.zadd(REDIS_POST_COMMENTS_PATH + postId,
                    new Date(comment.createdAt).getTime(), comment.id
                )
            });
            await pipeline.exec();
        }
        return res.status(200).json({ comments });
    } catch (err) {
        logger.error("Error fetching comments:", err)
        return res.status(500).json({ message: "Failed to get comment" })
    }
}

export { getComments, addComment }