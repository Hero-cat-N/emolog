-- CreateTable
CREATE TABLE "ai_usages" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usages_user_id_created_at_idx" ON "ai_usages"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
