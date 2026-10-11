/*
  Warnings:

  - Made the column `user_id` on table `logs` required. This step will fail if there are existing NULL values in that column.

*/
-- 認証を入れる前に作ったテスト用のログ（持ち主なし）を先に消す。
-- 残っていると下の SET NOT NULL が失敗する。log_tags・ai_summaries は onDelete: Cascade で一緒に消える
DELETE FROM "logs" WHERE "user_id" IS NULL;

-- DropForeignKey
ALTER TABLE "logs" DROP CONSTRAINT "logs_user_id_fkey";

-- AlterTable
ALTER TABLE "logs" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
