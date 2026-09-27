# Handoff: エモログ（SP + PC レスポンシブ 5ルート）

## Overview
エモログは、ゲームのプレイ記録を「やったこと／良かったこと／モヤったこと／明日やること」の4項目＋気分＋タグで1日1件記録し、AI が感情の傾向を要約する Web アプリ。本パッケージは SP（375px）と PC（1440px）の全5ルートのデザインと、デザイントークン・ルール（`design.md`）をまとめたもの。

## About the Design Files
`reference/` 内の HTML は **HTMLで作ったデザインリファレンス**（見た目と挙動を示すプロトタイプ）であり、本番コードではない。タスクは **Next.js (App Router) + Tailwind CSS + shadcn/ui で、これらのデザインを再実装すること**。HTML のインラインスタイルをそのまま移植せず、`design.md` のトークン（CSS variables / Tailwind 拡張）と shadcn/ui コンポーネントで組み直す。

`reference/エモログ レスポンシブ統合.dc.html` はブラウザで直接開ける（同フォルダの `support.js` が必要）。ルートごとに左に SP、右に PC を並べた対応表になっている。

## Fidelity
**High-fidelity。** 色・タイポグラフィ・余白・角丸・影は確定値。ピクセル単位で再現すること。ただし日付・件数・本文などのデータはダミー。

## Tech Stack / 前提
- Next.js App Router, TypeScript
- Tailwind CSS（**デフォルトのブレークポイントのみ**。独自定義は追加しない）
- shadcn/ui（Button, Input, Textarea, ToggleGroup, Badge, Tabs, Card, Calendar, AlertDialog, Sonner, Dialog, Drawer）
- グラフ: Recharts（shadcn chart）
- フォント: `next/font/google` で M PLUS Rounded 1c（700/800）、Noto Sans JP（400/500/700）
- アイコン: lucide-react（stroke 1.8 で統一。後述の対応表参照）

## 最重要ルール
1. **PC は SP と同じ要素だけで構成する。** 幅が広がっても要素は足さず、並べ方（カラム・ペイン）と寸法だけを変える。
2. **ナビは4項目固定・同順序**：ホーム／記録する／一覧／分析。SP は上部ヘッダーナビ（`/login` 以外の全画面で常時表示、下層の詳細でも省略しない）、PC はサイドナビ。
3. **モバイルファースト**。base を書き、`md:` / `lg:` で足す。`max-*` は使わない。構造の分岐は `md` と `lg` の2点のみ。
4. AI 由来の要素は必ず ✨ + accent バッジ（`#FBEEE7` bg / `#C74C1B` text）。緑は感情「楽しい」専用なので AI には使わない。
5. 1画面に primary（オレンジグラデ）CTA は原則1つ。

## ルート構成

| ルート | SP（base） | `md` | PC（`lg`〜） | 参照ID |
|---|---|---|---|---|
| `/login` | 縦積み | 中央カード420px | 中央カード420px | 1e |
| `/` | ②ダッシュボード 縦積み | アイコンナビ68px＋1カラム | サイドナビ＋2カラム | 1a |
| `/logs` | ④一覧 → `/logs/[id]` ⑥詳細へ遷移 | 一覧、詳細はフルスクリーンで重ねる | サイドナビ／一覧360px／詳細 を同居 | 1b |
| `/analytics` | ⑤ 縦積み | 1カラム | 左メイン＋右340px | 1c |
| `?compose` | 独立画面 | ボトムシート（Drawer） | 中央モーダル720px（Dialog） | 1d |

- `/logs/[id]` は `lg` 以上では `/logs` の右ペインに描画（Parallel Routes / Intercepting Routes、または searchParams `?id=` で実装。URL で詳細を直リンク可能にすること）。
- `?compose` はどのルートからでも開ける。中身（4項目・タグ・気分）は **同一コンポーネント**を、器（ページ／Drawer／Dialog）だけ切り替えて使う。
- `md`（タブレット）はデザイン未作成。上表と `design.md` §8 の方針で実装する。

## 共通レイアウト

### SP（base, 375px 基準・可変幅）
- 画面背景 `#FCF8F2`、ヘッダー・ナビ帯は `#FFFFFF`。
- **ページヘッダー**: padding `16px 20px`、下線 `1px #F0E7D8`。タイトル M PLUS Rounded 1c 700 14.5px。右側に補足（12px `#B58A5F`）やアイコンボタン（34×34, radius 10, bg `#F5EEE3`）。
- **ヘッダーナビ**: 4等分 flex、各 padding `13px 4px`、12.5px。非アクティブ `#B58A5F`、アクティブ `#C74C1B` 700 + 下線 `2px #D85528`。帯の下線 `1px #F0E7D8`。
- **本文**: padding `16–18px 20px`、縦 gap 14–16px、bg `#FCF8F2`。
- セクションラベル: Noto Sans JP 700 11px `#6E5847`、下 margin 7–8px。

### PC（`lg`〜, 1440×900 基準）
- **サイドナビ**: 幅236px、bg `#FFFFFF`、右線 `1px #F0E7D8`。上部にワードマーク（高さ26px、padding `22px 20px 18px`）。項目は padding `11px 12px`、radius 10、gap 10、13px、アイコン17px。非アクティブ `#6E5847`、アクティブ bg `#FBEEE7` / `#C74C1B` 700。
- **ページヘッダー**: padding `20px 32px`、bg `#FFFFFF`、下線 `1px #F0E7D8`。タイトル M PLUS Rounded 1c 800 20px。
- **本文**: padding `24–28px 32px`、2カラムは gap 24px、右カラム幅 340px（固定）。
- `xl` 以上はコンテンツ最大幅 1440px。

## Screens

### 1e `/login`
**SP**: 背景 `#FCF8F2`、中央寄せ縦積み、padding `52px 28px 34px`。
- アイコン 58×58（`assets/emolog-icon-light.svg`）→ 14px → ワードマーク 高さ32px → 10px → キャッチ「今日のプレイを、3秒で記録する」13px `#B58A5F` → 32px
- 入力2つ（gap 14）: ラベル 12px 500 `#6E5847`「メールアドレス」「パスワード」、フィールド padding `12px 14px`、radius 10、border `1px #E8DECF`、bg `#FFFFFF`、placeholder `#B8ADA0` 14px
- 「ログイン」ボタン: 幅100%、padding 14、radius 12、グラデ `linear-gradient(135deg,#E3673B,#D24F1C)`、文字 `#FCF8F2` 15px 700、影 `0 8px 18px rgba(216,85,40,.35)`
- 区切り「または」11px `#B58A5F` + 両側 1px `#E8DECF`
- 「Google でログイン」: outline、padding 12、radius 10、border `#E8DECF`、13.5px 500、Google 4色ロゴ16px
- 「アカウントをお持ちでない方はこちら」12px `#B58A5F`

**PC**: 1440×900 背景 `#FCF8F2` の中央に カード 幅420px（bg白、border `1px #E8DECF`、radius 20、padding `46px 36px 32px`、影 `0 12px 36px rgba(58,26,8,.1)`）。中身は SP と同じ要素・同じ順序。入力 bg は `#FCF8F2`、padding `13px 14px`。ナビなし。

### 1a `/`（ダッシュボード）
**要素（SP/PC 共通）**
1. 挨拶「こんにちは」11–11.5px `#B58A5F` ＋「ハナキチ さん」M PLUS Rounded 1c（SP 700 17px / PC 800 20px）
2. KPI 3枚（等幅 flex）
   - 連続記録: グラデ背景、炎アイコン、数値「5日」M PLUS Rounded 1c 800（SP 22px / PC 32px）、ラベル「連続記録」
   - 今月の記録: bg `#F5EEE3`、「18件」
   - 直近の気分: bg `#F5EEE3`、😄
   - radius 14（PC 16）、padding SP `13px 10px` / PC 20px
3. AI 傾向カード: bg `#FBEEE7`、border `1px #F6D9CB`、radius 14–16。スパークルアイコン `#C74C1B`、バッジ「✨ AI」（白bg、`#C74C1B`、border `#F0C7B4`）＋「6/19 09:00 生成」、本文13–14.5px lh1.6–1.7、リンク「詳しい分析を見る →」`#C74C1B` 600
4. 直近7日間: 7列グリッド、記録日は「楽しい」ティント bg `#E3F3EA` / text `#1E7A50` 600、今日は bg `#3B2A1F` / text `#FCF8F2` 700。SP は正方形 radius 7、PC は高さ64px radius 10
5. 「今日はまだ記録がありません／今日はどうしますか？」カード（白、border `#E8DECF`、右にシェブロン）→ タップで `?compose`
6. クイックアクション 3列: 一覧を見る／分析を見る／下書き生成（白、border `#E8DECF`、radius 12–14、アイコン `#C74C1B`）

**PC 配置**: 左メイン = 1→（ヘッダー内）/ 2 / 3 / 4、右カラム340px = 5 / 6。

### 1b `/logs` と `/logs/[id]`
**④一覧（SP / PC 左ペイン360px）**
- ヘッダー「ログ一覧」＋検索アイコンボタン
- 表示切替 Tabs（segmented）: 月ごと／週ごと／日/カレンダー。コンテナ bg `#F5EEE3` radius 10 padding 3、選択 bg白 700 影 `0 1px 3px rgba(58,26,8,.1)`
- 月カレンダー: 「‹ 2026年 6月 ›」、7列、日付11.5px、下に感情ドット5px（楽しい `#2E9E6B` / 普通 `#8F8578` / イライラ `#D85528` / 疲れ `#8B78C8`）、前後月の日付 `#D8CDBD`。凡例を下に表示
- 選択日のログカード: 白、border `#E8DECF`、radius 12、日付・感情絵文字・本文13px・タグ（bg `#FBEEE7` / `#C74C1B`）
- PC では選択中の日付とカードを `#D85528` 1.5px 枠で強調

**⑥詳細（SP 別画面 / PC 右ペイン）**
- ヘッダー: 日付「2026/6/10」＋曜日、右に編集・その他アイコンボタン
- 感情バナー: 円48–50px（感情ティント bg）＋「楽しい」＋「自動判定 · 手動で変更する」
- タグ行（`#F5EEE3` チップ ＋ 破線「＋タグを追加」）
- 4セクション: ラベル 10.5px 700 `#B58A5F`、本文 13–13.5px lh1.7–1.8。空は「記録なし」italic `#B58A5F`
- AI 分析ブロック（bg `#FBEEE7`）: 「AI 分析」＋「自動生成」バッジ＋生成時刻、白カード3つ（感情キーワード／ひとこと要約／ブログ下書き生成リンク）
- アクション: 「SNS にシェア」「テキストをコピー」（outline 2列）、「このログを削除」（border `#F0BDB4`、文字・アイコン `#C0392B`）→ AlertDialog で確認
- 前日／翌日ナビ（左右2分割、日付10px＋ラベル12px）

**PC 配置**: 右ペイン内をさらに 本文（可変）｜AI列300px に分割。本文側 = 感情バナー・タグ・4セクション・前日/翌日。AI列 = AI分析ブロック＋アクション。

### 1c `/analytics`
**要素**: 期間 Tabs（1週間／1ヶ月／3ヶ月）、メトリクス3枚（記録日数18／多い感情😄／連続記録5、白 border `#E8DECF` radius 11–14）、感情スコアの推移（折れ線 `#D85528` 2.5–3px ＋ 感情色ドット、グリッド線 `#F0E7D8`）、感情の内訳（横棒：ラベル幅80px nowrap、トラック `#F5EEE3` 高さ8–10px、件数）、よく遊んだコンテンツ（上位2つ accent チップ、残り outline）、インサイト（AI）カード。

**PC 配置**: 期間 Tabs（幅360px）→ メトリクス3列 → 下段2カラム［左: 推移・内訳｜右340px: コンテンツ・インサイト］。

### 1d `?compose`（記録）
**要素**: タイトル「今日の記録」＋日付、4フィールド（ラベル12.5px 500 ＋ 必須/任意バッジ：必須 bg `#FBEEE7` `#C74C1B` / 任意 bg `#F5EEE3` `#B58A5F`）、タグ（選択 bg `#3B2A1F` / `#FCF8F2`、未選択 outline、破線「＋追加」）、今日の気分 ToggleGroup 5種、フッターに文字数（11–11.5px `#B58A5F`）＋「保存する」グラデボタン。
- フォーカス中フィールド: border `1.5px #D85528` ＋ `box-shadow: 0 0 0 3px #FBEEE7`
- 気分選択中: 感情色 1.5px 枠＋ティント背景（楽しい: `#2E9E6B` / `#E7F5EE` / 文字 `#1E7A50`）

**SP**: 独立画面（ヘッダーナビで「記録する」がアクティブ）。
**PC**: ホームの上に Dialog。オーバーレイ `rgba(58,26,8,.42)`、モーダル幅720px、radius 18、影 `0 24px 64px rgba(58,26,8,.34)`。ヘッダーに閉じるボタン（32×32, bg `#F5EEE3`）。4フィールドは 2×2 グリッド gap 14、各 min-height 74px。

## Interactions & Behavior
- ナビ: 現在ルートをアクティブ表示。`/logs/[id]` では「一覧」がアクティブ。
- 記録: 必須は「今日やったこと」「良かったこと」「明日やること」。未入力で保存不可（ボタン disabled）。保存後 Sonner「今日の記録を保存しました」。1日1件（同日は編集になる）。
- 保存後に AI が感情キーワード・要約を非同期生成 → 完了時 Sonner「AI分析が完了しました」。
- 一覧: カレンダーの日付クリックで下のカード（PC は右ペイン）を切り替え。記録なし日は空状態。
- 削除: AlertDialog「このログを削除しますか？」→ 確定で一覧へ戻る。
- ホバー: primary ボタンは `#C74C1B` 寄りに暗く、outline は bg `#FBEEE7`。トランジション 150ms ease。

## State / Data
- `logs`: `logged_date`（user_id と合わせて UNIQUE）、`did_today`, `good_thing`, `bad_thing`, `tomorrow_plan`, `emotion_id`, `is_ai_generated`
- `emotions`: 5行マスタ（name, color, score, sort_order）。色はこの表と `design.md` の感情カラーを一致させる
- `tags` / `log_tags`: ユーザー単位
- `ai_summaries`（ログ単位：キーワード・要約・生成日時）、`insights`（期間単位：傾向文・対象期間・生成日時）
- `users`: `oauth_provider`, `oauth_uid` を持つ（Google ログイン）
- AI 表示には必ず生成日時を併記する

## Design Tokens
`design.md` §1–4 を正とする。`globals.css` の shadcn CSS variables と `tailwind.config.ts` の `emotion.*` / `brand.*` 拡張をそのまま貼り付けて使う。本README内の追加値:
- 外枠線 `#F0E7D8`（ヘッダー・ナビ・ペインの区切り線）
- 前後月日付 `#D8CDBD`、placeholder `#B8ADA0`
- 感情ティント: 楽しい `#E7F5EE`/`#E3F3EA`、普通 `#F1EFEC`、イライラ `#FBEEE7`、疲れ `#F0EDFA`
- 削除系: 文字 `#C0392B`、枠 `#F0BDB4`

## Icons（lucide-react 対応）
Home / PenLine / List / BarChart3（ナビ）、Sparkles（AI）、Search、ChevronLeft / ChevronRight、MoreHorizontal、Share2、Copy、Trash2、X、Flame（連続記録、塗り）。stroke-width 1.8。UI ラベルに絵文字は使わない（感情表現のみ絵文字）。

## Assets
- `assets/emolog-icon-light.svg` — アプリアイコン
- `assets/emolog-wordmark-light.svg` — ワードマーク（サイドナビ・ログイン）

## Files
- `design.md` — トークン・ルール・レスポンシブ方針（§8）
- `reference/エモログ レスポンシブ統合.dc.html` — SP/PC 全5ルートの見本（1a〜1e）。ブラウザで開いてピクセル確認に使う
