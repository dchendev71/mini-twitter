import prisma from "../prismaClient.js"
import logger from "../utils/logger.js"
import { REDIS_POST_LIKES_PATH, REDIS_USER_LIKED_POSTS_PATH } from "../redisClient.js"

async function likePost(req, res) {
    try {
        const userId = req.user.id
        const postId = parseInt(req.params.postId, 10)

        const existing = await prisma.like.findUnique({
            where: { userId_postId: { userId, postId } }
        })
        if (existing) {
            return res.status(400).json({ message: "Post already liked"})
        }
        await prisma.like.create({
            data: {
                userId: userId,
                postId: postId,
            }
        })

        const redis = req.app.locals.redis;
        await redis.sadd( REDIS_POST_LIKES_PATH + postId, userId)
        await redis.sadd( REDIS_USER_LIKED_POSTS_PATH + userId, postId)

        return res.status(201).json({ message: "Post liked" })
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Failed to like post"})
    }
}

async function unlikePost(req, res) {
    try {
        const userId = req.user.id
        const postId = parseInt(req.params.postId, 10)

        await prisma.like.delete({
            where: { userId_postId: { userId, postId } }
        })

        const redis = req.app.locals.redis;
        await redis.srem(REDIS_POST_LIKES_PATH + postId, userId)
        await redis.srem(REDIS_USER_LIKED_POSTS_PATH + userId, postId)

        return res.status(200).json({ message: "Post unliked" })
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(400).json({ message: "Can not unlike if not liked before"})
        }
        logger.error(err)
        return res.status(500).json({ message: "Failed to unlike post" })
    }
}

// Function which returns the number of likes on the Post and
// if the user liked it
async function getLikes(req, res) {
    try {
        const userId = req.user.id
        const postId = parseInt(req.params.postId, 10)
        const redis = req.app.locals.redis
        let [count, liked] = await Promise.all([
            redis.scard(REDIS_POST_LIKES_PATH + postId),
            redis.sismember(REDIS_POST_LIKES_PATH + postId, userId)
        ])
        if (count === 0) {
            count = await prisma.like.count({ where: { postId } });
            const values = (await prisma.like.findMany({ where: { postId }, select: { userId: true } })).map((l) => l.userId)
            if (values.length > 0) {
                await redis.sadd(REDIS_POST_LIKES_PATH + postId, values)
                liked = values.includes(userId)
            }
        }
        return res.status(200).json({ likes: count, liked: !!liked });
    } catch (err) {
        logger.error(err)
        return res.status(500).json({ message: "Failed to get likes" })
    }
}

export { likePost, unlikePost, getLikes }