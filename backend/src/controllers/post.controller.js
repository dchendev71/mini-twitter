import prisma from "../prismaClient.js";
import logger from "../utils/logger.js";

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

export { createPost };
