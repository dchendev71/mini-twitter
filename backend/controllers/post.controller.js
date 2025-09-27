import prisma from "../prismaClient.js";
import logger from "../utils/logger.js"
/*
model Post {
  id            Int      @id @default(autoincrement())
  authorId      Int
  author        User     @relation(fields: [authorId], references: [id])
  text          String?  @db.VarChar(280)
  attachments   Json?
  retweetOfId   Int? 
  retweetOf     Post?    @relation("PostRetweets", fields: [retweetOfId], references: [id])
  retweets      Post[]   @relation("PostRetweets") // inverse side
  likesCount    Int      @default(0)
  retweetsCount Int      @default(0)
  createdAt     DateTime @default(now())
  likes         Like[]

  @@index([authorId, createdAt])
  @@unique([authorId, retweetOfId])
}
*/
async function createPost(req, res) {
    try {
        const { content } = req.body
        if (!content || content.trim() === "") {
            return res.status(403).json({ message: "post content cannot be empty"});
        }

        const post = await prisma.post.create({
            data: {
                authorId: req.user.id,
                text: content,
            },
            include: {
                author: true
            }
        })

        return res.status(201).json({
            message: "post created succesfully",
            post
        })
    } catch (err) {
        logger.error("Error creating post:", err);
        return res.status(500).json({
            message: "failed to create post"
        });
    }
}

export { createPost }