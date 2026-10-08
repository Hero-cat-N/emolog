-- CreateTable
CREATE TABLE "ai_summaries" (
    "id" BIGSERIAL NOT NULL,
    "log_id" BIGINT NOT NULL,
    "keywords" TEXT[],
    "summary" TEXT NOT NULL,
    "blog_draft" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_summaries_log_id_key" ON "ai_summaries"("log_id");

-- AddForeignKey
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
