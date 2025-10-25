import prisma from "../prismaClient.js";
import logger from "../utils/logger.js";
import { REDIS_FOLLOWERS_PATH, REDIS_FOLLOWING_PATH } from "../redisClient.js";

async function follow(req, res) {
  try {
    const followee = parseInt(req.params.userId, 10);
    const follower = req.user.id;

    if (followee == follower) {
      return res.status(400).json({ message: "can not follow yourself" });
    }

    await prisma.follow.create({
      data: {
        followerId: follower,
        followeeId: followee,
      },
    });

    const redis = req.app.locals.redis
    await redis.sadd(REDIS_FOLLOWERS_PATH + followee, follower)
    await redis.sadd(REDIS_FOLLOWING_PATH + follower, followee)

    return res.status(201).json({ message: "follow succesful" });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ message: "can not follow same person twice" });
    }
    logger.error(err);
    return res.status(500).json({ message: "failed to follow" });
  }
}

async function unfollow(req, res) {
  try {
    const follower = req.user.id;
    const followee = parseInt(req.params.userId, 10);

    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: follower,
        followeeId: followee,
      },
    });

    const redis = req.app.locals.redis
    await redis.srem(REDIS_FOLLOWERS_PATH + followee, follower)
    await redis.srem(REDIS_FOLLOWING_PATH + follower, followee)

    if (deleted.count === 0) {
      return res.status(404).json({ message: "you do not follow this user" });
    }
    return res.status(201).json({ message: "unfollow succesful" });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "failed to unfollow" });
  }
}

async function getList(params, mappingFunc) {
  const { redis, listPath, dbReq } = params

  const cached = await redis.smembers(listPath);
  let list = []
  if (cached && cached.length > 0) {
    list = await prisma.user.findMany({
      where: {
        id: {
          in: cached.map(Number)
        }
      }
    })
  } else {
    const dbResults = await prisma.follow.findMany(dbReq)
    list = dbResults.map(mappingFunc)
  }
  return list
}

async function getFollowers(req, res) {
  const userId = parseInt(req.params.userId, 10)
  const params = {
    redis: req.app.locals.redis,
    listPath: REDIS_FOLLOWERS_PATH + userId,
    dbReq: { where: {  followeeId: userId }, include: { follower: true}}
  }
  return res.status(201).json(await getList(params, (f) => f.follower))
}

async function getFollowing(req, res) {
  const userId = parseInt(req.params.userId, 10);
  const params = {
    redis: req.app.locals.redis,
    listPath: REDIS_FOLLOWING_PATH + userId,
    dbReq: { where: {  followerId: userId }, include: { followee: true}}
  }
  return res.status(201).json(await getList(params, (f) => f.followee))
}

export { unfollow, follow, getFollowers, getFollowing };
