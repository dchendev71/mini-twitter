import prisma from "../prismaClient.js";
import logger from "../utils/logger.js";

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

    if (deleted.count === 0) {
      return res.status(404).json({ message: "you do not follow this user" });
    }
    return res.status(201).json({ message: "unfollow succesful" });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: "failed to unfollow" });
  }
}

async function getFollowers(req, res) {
  const userId = parseInt(req.params.userId, 10);
  const followers = await prisma.follow.findMany({
    where: { followeeId: userId },
    include: { follower: true },
  });

  return res.status(201).json(followers.map((f) => f.follower));
}

async function getFollowing(req, res) {
  const userId = parseInt(req.params.userId, 10);
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { followee: true },
  });

  return res.status(201).json(following.map((f) => f.followee));
}

export { unfollow, follow, getFollowers, getFollowing };
