import prisma from "../prismaClient.js"

async function searchPosts(req, res) {
  if (!req.query) {
    return res.status(403).json({ message: "Invalid parameters"})
  }
  const query = req.query['q']
  if (typeof(query) !== "string" || query.trim() === "") {
    return res.status(403).json({ message: "Empty search parameters"})
  }
  const posts = await prisma.post.findMany({
    where: {
      text: {
        contains: query,
        mode: "insensitive"
      },
    },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  })

  return res.status(200).json(posts)
}

async function searchUsers(req, res) {
    if (!req.query) {
        return res.status(403).json({message: "Invalid parameters"})
    } 
    const q = req.query['q']
    if (typeof(q) !== "string" || q.trim() === "") {
        return res.status(403).json({ message: "Empty search parameters"})
    }

    const users = await prisma.user.findMany({
        where: {
            username: {
                contains: q,
                mode: "insensitive"
            },
        },
    })

    return res.status(200).json(users)
}

export { searchPosts, searchUsers };

