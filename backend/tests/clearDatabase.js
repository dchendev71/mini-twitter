import prisma from "../prismaClient.js";

export async function clearDatabase() {
  // Delete from child tables first if you have foreign key constraints
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();         // Posts depend on Users
  await prisma.user.deleteMany();         // Users last
  // Add other models here if needed
}
