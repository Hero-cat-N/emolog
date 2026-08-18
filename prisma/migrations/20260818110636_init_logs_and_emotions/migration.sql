-- CreateTable
CREATE TABLE "emotions" (
    "id" SMALLSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "emotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "emotion_id" SMALLINT,
    "did_today" TEXT NOT NULL,
    "good_thing" TEXT NOT NULL,
    "bad_thing" TEXT,
    "tomorrow_plan" TEXT NOT NULL,
    "logged_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emotions_code_key" ON "emotions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "logs_user_id_logged_date_key" ON "logs"("user_id", "logged_date");

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_emotion_id_fkey" FOREIGN KEY ("emotion_id") REFERENCES "emotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
