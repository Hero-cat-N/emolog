# emolog 開発ログ

転職活動用ポートフォリオ + 学習カリキュラムを兼ねて作っている「今日の記録」アプリ(Next.js / shadcn-ui / zod / react-hook-form)の開発の流れをまとめたもの。

## タイムライン

### 2026-08-04 `c7bb760` プロジェクト作成
- Create Next Appでプロジェクトの土台を作成

### 2026-08-05 `da33a51` UIの土台
- shadcn/uiを導入し、「今日の記録」投稿カードの見た目(レイアウトのみ)を作成

### 2026-08-08 `6334437` フォームのレイアウト調整・ヒントコメントを追加
- 投稿フォームのレイアウトを整える
- 状態管理・イベント配線はあえて実装せず、`// ヒント: ...`コメントだけ残した状態でコミット
  - 当時、学習カリキュラムとの両立で気力が落ちていたため、「実装は後回しにしてヒントだけ残す」という進め方を選択

### 2026-08-10 `1c6ab1a` 状態管理・イベント配線を実装
- `useState`で`today` / `good` / `tomorrow` / `mood`を管理
- `inputChange`(テキスト入力)、`moodChange`(気分トグル)を実装
- `ToggleGroup`を`defaultValue`から`value`に変更し、controlled componentに(uncontrolled警告の解消)
- **つまずいた点**: JavaScript/Reactのスコープ(コンポーネント関数の外 / 中 / イベントハンドラの中、で「いつ実行されるか」が違う)の理解に時間がかかった

### 2026-08-10 `e70477e` zodによるバリデーションを実装(手動)
- `postSchema`(zod)を定義し、`handleSubmit`内で`safeParse`を実行
- 送信ボタンの`type`を明示的に`"submit"`に修正
  - **つまずいた点**: 使っている`@base-ui/react`の`Button`はデフォルトが`type="button"`(誤送信防止のための仕様)で、`type="submit"`を明示しないとフォームのsubmitイベント自体が発火しないバグに遭遇

### 2026-08-10 `da1456c` ログイン画面の土台(別作業)
- `app/(auth)/login`、`components/login-form.tsx`、shadcnの`field.tsx`を追加
- `CardTitle`に見出し用フォント(`font-heading`)を追加
- 投稿フォームの作業とは別系統の変更

### 2026-08-10 `3524898` react-hook-form + zodResolverへ移行
- 手動の`useState`管理から`react-hook-form`(`useForm` + `zodResolver(postSchema)`)へ移行
- テキスト入力は`register`、`ToggleGroup`(独自コンポーネント)は`Controller`で配線
- HTML標準の`required`を削除し、zodの`nonempty`メッセージを`form.formState.errors`から画面に表示
- **つまずいた点**:
  - `useForm()`をコンポーネント関数の外に書いてReact Hooksのルール違反になった
  - `defaultValues`の`mood: "normal"`がTypeScriptの型推論で`string`型に広がってしまい(型のwidening)、zodのenum型と噛み合わなくなった → `as const`で解決
  - `resolver: zodResolver(postSchema)`(react-hook-formとzodをつなぐアダプター)は、正しく書けるようになった後も「なぜこう書くのか」の腹落ちに時間がかかった

### 2026-08-18 `f55a917` 投稿フォームの送信内容をlocalStorageに保存する処理を実装
- 送信データに`id`・`createdAt`を付与し、既存の記録一覧に追加してlocalStorageへ保存
- バックエンド連携の前段階として、まずlocalStorageで保存の流れを一通り動かした

### 2026-08-18 `87e34ee` Supabase + Prismaでの保存の土台を構築
- `schema.prisma`に`Log`/`Emotion`モデルを定義し、`prisma migrate dev`でSupabase上に実テーブルを作成
- 認証は未実装のため`Log.userId`は一旦nullable、`Emotion`は感情の種類を管理するマスタテーブルとして正規化
- Prisma 7のdriver adapter方式(`@prisma/adapter-pg`)に合わせて`prisma.config.ts`で接続設定、`lib/prisma.ts`でシングルトンな`PrismaClient`を用意
- `app/api/logs/route.ts`にGET(一覧取得)ハンドラを実装
- **つまずいた点**:
  - Prisma 7では`schema.prisma`の`datasource`に`url`/`directUrl`を直接書けなくなっており(`prisma.config.ts`に移動する仕様変更)、旧来の書き方のまま進めてバリデーションエラーになった
  - `prisma.logs.findMany(...)`と書いてエラー。Prisma Clientのモデルアクセサは`@@map`で指定した実テーブル名ではなく、`schema.prisma`のモデル名(`Log`→`prisma.log`)基準だと理解した
  - `orderBy: { created_at: ... }`もエラー。クエリで使うのは`@map`前のPrisma側フィールド名(`createdAt`)で、DBの実列名を直接書くものではないと理解した
  - `@prisma/client`をインストールしていなかったため`Module not found: Can't resolve '@prisma/client/runtime/client'`が発生。出力先を指定するdriver adapter方式でも、共通ランタイムは`@prisma/client`パッケージ本体に依存していた

### 2026-08-19 `ac7d260` emotionsマスタへのシードデータ投入とPOST /api/logsを実装
- `prisma/seed.ts`で`emotions`(fun/normal/sad/frustrate)を投入する仕組みを用意し、`prisma.config.ts`に配線(`prisma db seed`で実行)
- `app/api/logs/route.ts`にPOSTハンドラを追加。zodで再検証 → `mood`から対応する`Emotion`を検索して`emotionId`に変換 → `prisma.log.create`
- `postSchema`を`lib/validations/post.ts`に切り出し、クライアント/サーバーで二重管理にならないようにした

### 2026-08-19 `9f27646` 投稿フォームをPOST /api/logsに接続
- 送信処理をlocalStorageから`fetch`によるAPI呼び出しに置き換え、失敗時は`form.setError("root", ...)`、成功時のみ`form.reset()`
- `isSubmitting`で送信中はボタンを`disabled`にし、文言を「保存中…」に出し分け
- 実際にフォームから送信し、Supabaseに実データが保存されることを確認
- **つまずいた点**:
  - `fetch`の戻り値を`await`で受け取らず`res.ok`を参照してしまい、「`res`が定義されていない」エラーになった。`const res = await fetch(...)`のように、戻り値を変数で受け取る必要があると理解した
  - `form.reset()`が`if`ブロックの外にあり、保存に失敗した場合でも実行されてしまう(エラーは出るのに入力内容も消える)バグに気づき、`if`の中で`return`することで成功時だけ`reset`されるように修正した

## この期間で身につけたこと

- Reactのスコープ(モジュールスコープ / コンポーネントのレンダースコープ / イベントハンドラ)とHooksのルール
- controlled / uncontrolled componentsの違い
- zodによるスキーマバリデーション(`.min()` / `.nonempty()` / `.enum()` とカスタムエラーメッセージ)
- react-hook-formの基本(`register` / `Controller` / `handleSubmit` / `formState.errors`)
- ライブラリのデフォルト挙動を疑う視点(今回は`Button`の`type`デフォルト)

## 次にやりたいこと

- 入力内容の確認画面(送信前に内容を見せてから確定するフロー)
- エラーメッセージのスタイル調整
- (将来)認証の実装、一覧画面での記録表示
