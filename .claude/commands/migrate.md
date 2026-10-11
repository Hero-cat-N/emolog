---
description: schema.prisma の変更からマイグレーションを作成・確認・適用する
argument-hint: "<マイグレーション名（英語のスネークケース）>"
---

`prisma/schema.prisma` の変更をデータベースに反映してください。マイグレーション名: $ARGUMENTS

1. `npx prisma validate` でスキーマが正しいか確認する
2. `npx prisma migrate dev --create-only --name $ARGUMENTS` で、適用せずに SQL だけ作る
3. 作られた `migration.sql` を読み、何が変わるかを日本語で説明する
   - 列やテーブルの削除・型の変更など、既存データが消える・変わる操作があれば、**適用する前に必ず私に確認する**
4. 問題なければ `npx prisma migrate dev` で適用し、`npx prisma generate` で Prisma Client を作り直す
5. `npx tsc --noEmit` で型エラーが出ていないか確認する
6. 最後に「開発サーバー（`npm run dev`）を再起動してください」と伝える（Prisma Client を使い回しているため、再起動するまで新しいモデルが使えない）
