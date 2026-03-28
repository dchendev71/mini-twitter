/*
  Warnings:

  - You are about to drop the column `likesCount` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "likesCount",
ADD COLUMN     "commentOfId" INTEGER;

-- CreateIndex
CREATE INDEX "Like_postId_idx" ON "public"."Like"("postId");

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_commentOfId_fkey" FOREIGN KEY ("commentOfId") REFERENCES "public"."Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
