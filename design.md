# エモログ デザイン要件

## 1. ブランドカラー（ロゴ由来）

ロゴ（emolog-icon / emolog-wordmark）から抽出した基準色。

| 名称 | HEX | 用途 |
|---|---|---|
| Brand Orange | `#D85528` | プライマリ（グラデ #E3673B→#D24F1C の中間値） |
| Brand Orange Deep | `#C74C1B` | プライマリ hover / アイコン内アクセント |
| Brand Orange Light | `#E3673B` | グラデーション上端・強調背景 |
| Cream | `#FCF8F2` | アプリ背景（ロゴのハート/カプセル色） |
| Ink Brown | `#3B2A1F` | 見出し・本文（ワードマーク「エモログ」色） |
| Tan | `#B58A5F` | 補助テキスト・ラベル（EMOLOG サブテキスト色） |
| Shadow Brown | `#3A1A08` | 影・オーバーレイ（透過で使用） |

### 派生パレット（UI用に展開）

| トークン | HEX | 用途 |
|---|---|---|
| `orange-50` | `#FBEEE7` | 選択状態の背景・バッジ背景 |
| `orange-100` | `#F6D9CB` | ボーダー弱・hover背景 |
| `orange-600` | `#D85528` | primary |
| `orange-700` | `#C74C1B` | primary hover |
| `orange-800` | `#A03D14` | active / 濃色テキスト |
| `brown-900` | `#3B2A1F` | foreground |
| `brown-600` | `#6E5847` | secondary text |
| `tan-500` | `#B58A5F` | muted text / キャプション |
| `cream-50` | `#FCF8F2` | background |
| `cream-100` | `#F5EEE3` | muted / surface2 |
| `cream-border` | `#E8DECF` | border |

### セマンティック（感情カラー）

感情は emotions マスタの5種に対応。彩度をブランドに寄せた暖色系トーンで統一。

| 感情 | HEX | メモ |
|---|---|---|
| 😄 楽しい | `#2E9E6B` | positive（green） |
| 😐 普通 | `#8F8578` | neutral（warm gray） |
| 😞 悲しい | `#5B7FC7` | sad（blue） |
| 😤 イライラ | `#D85528` | angry（brand orange と共用） |
| 😴 疲れ | `#8B78C8` | tired（purple） |

補助: 成功 `#2E9E6B` / 警告 `#E09A28` / エラー `#CC3B2B`

## 2. Tailwind CSS 設定

shadcn/ui 規約の CSS variables（globals.css）:

```css
:root {
  --background: 39 56% 97%;        /* #FCF8F2 cream */
  --foreground: 23 31% 18%;        /* #3B2A1F ink brown */
  --card: 0 0% 100%;
  --card-foreground: 23 31% 18%;
  --popover: 0 0% 100%;
  --popover-foreground: 23 31% 18%;
  --primary: 15 69% 50%;           /* #D85528 brand orange */
  --primary-foreground: 39 56% 97%;
  --secondary: 38 47% 93%;         /* #F5EEE3 cream-100 */
  --secondary-foreground: 23 31% 18%;
  --muted: 38 47% 93%;
  --muted-foreground: 32 35% 54%;  /* #B58A5F tan */
  --accent: 20 71% 95%;            /* #FBEEE7 orange-50 */
  --accent-foreground: 17 76% 43%; /* #C74C1B */
  --destructive: 6 65% 48%;        /* #CC3B2B */
  --destructive-foreground: 39 56% 97%;
  --border: 36 35% 86%;            /* #E8DECF */
  --input: 36 35% 86%;
  --ring: 15 69% 50%;
  --radius: 0.625rem;
}
```

tailwind.config.ts 拡張（感情カラー）:

```ts
extend: {
  colors: {
    emotion: {
      happy: "#2E9E6B",
      neutral: "#8F8578",
      sad: "#5B7FC7",
      angry: "#D85528",
      tired: "#8B78C8",
    },
    brand: {
      DEFAULT: "#D85528",
      deep: "#C74C1B",
      light: "#E3673B",
    },
  },
}
```

## 3. タイポグラフィ

- 見出し・ロゴ周り: **M PLUS Rounded 1c**（800/700）— ワードマークと同一
- 本文 UI: **Noto Sans JP**（400/500/700）
- 英字アクセント（ラベル・数値）: **Quicksand**（700）— EMOLOG サブテキストと同一
- 最小サイズ: 本文 14px / キャプション 11px / モバイルタップ領域 44px 以上

## 4. 形状・エレベーション

- 角丸: カード 12px / ボタン・入力 10px / チップ・タグ full / アプリアイコン比率 23%
- 影: `0 1px 3px rgba(58,26,8,.10)`（ロゴの shadow brown を透過利用）。強い影は使わない
- ボーダー: 1px `#E8DECF`。選択状態は `#D85528` 1.5px

## 5. shadcn/ui 使用コンポーネント対応表

| UI要素 | shadcn/ui | 備考 |
|---|---|---|
| 保存・ログイン等の主ボタン | Button (default) | bg-primary |
| 副ボタン・OAuthボタン | Button (outline / secondary) | |
| 削除 | Button (destructive) | |
| 入力・テキストエリア | Input / Textarea | 必須は Badge で明示 |
| 気分セレクタ | ToggleGroup | 感情カラーで選択状態 |
| タグ | Badge (outline) + Toggle | 選択で accent 背景 |
| 画面内タブ（期間・表示切替） | Tabs | |
| ログカード | Card | |
| AI生成バッジ | Badge | accent 配色 + ✨ |
| カレンダー | Calendar | 感情ドットはカスタム |
| グラフ | Recharts + chart config | 感情カラーを series に |
| ダイアログ（削除確認等） | AlertDialog | |
| トースト | Sonner | 保存完了通知 |
| ボトムナビ | カスタム | shadcn に該当なし |

## 6. 適用ルール

- オレンジは「行動を促す1箇所」に絞る（1画面に primary は原則1つ）
- 背景は cream、カードは white の2層のみ。3層目が要る時は cream-100
- 感情カラーは意味を持つ場所（ドット・バー・バッジ）以外に使わない
- AI 由来の要素（insights / ai_summaries / is_ai_generated）には必ず ✨ + accent バッジでラベリング。**AI要素の色は常に accent（オレンジ系 #FBEEE7/#C74C1B）に統一** — 緑は感情「楽しい」専用のため流用しない

## 7. ハイファイ実装ルール（エモログ ハイファイ.dc.html 反映分）

### ロゴ・アイコン
- ロゴは `uploads/emolog-icon-light.svg`（アイコン単体）・`emolog-wordmark-light.svg`（ワードマーク）の実データを使用。テキストや絵文字での代替は不可
- UI操作アイコン（戻る・編集・検索・共有・コピー・削除・シェブロン・グラフ・スパークル等）は **line icon**（stroke-based, viewBox 24x24, stroke-width 1.8, currentColor系）で統一。色は文脈に応じ `#6E5847`（標準）/ `#C74C1B`（AI・アクセント文脈）/ `#C0392B`（削除）
- 絵文字は「感情（😄😐😞😤😴）」「気分の直近サマリー」など**コンテンツそのもの**を表す場合のみ使用。UIのラベルアイコンとしての絵文字（📋📊✏️等）は使わない

### カラー適用の確定事項
- プライマリボタン・ストリークカードなどの主要CTA/強調ブロックは単色でなく **グラデーション** `linear-gradient(135deg, #E3673B, #D24F1C)` を使用 + `box-shadow: 0 6-8px 14-18px rgba(216,85,40,.3-.35)`
- 記録済み日（カレンダー・ミニカレンダー）は感情色の**ティント背景**を使う（例: 楽しい→bg `#E3F3EA` / text `#1E7A50`）。ベタ塗りの濃色は使わない
- 選択中タグ・選択中チップは `#3B2A1F` bg / `#FCF8F2` text（感情トグルは各感情色のティント＋ボーダーで表現、タグは無彩のダーク反転）

### タイポグラフィの適用範囲（重要な訂正）
- **Quicksand は欧文・数字のみ**に使用（Quicksand は日本語グリフを持たないため）。日本語のセクションラベル（「直近7日間」等）は Noto Sans JP 700 の小さめサイズで代用し、Quicksand を強制しない
- 見出し・ブランド文脈（画面タイトル、ワードマーク周辺）は M PLUS Rounded 1c 700/800

### カード・エレベーション
- 375px モバイルカードの外枠: `border-radius: 22px`, `border: 1px solid #F0E7D8`, `box-shadow: 0 12px 36px rgba(58,26,8,.14)`（design.md 5節の基本影より一段強い、画面外枠専用の値）
- カード内部要素（ログカード・メトリクスカード等）は基本影 `0 1px 3px rgba(58,26,8,.10)` のまま

### チャート
- 折れ線グラフはプレースホルダーテキストではなく、簡易 SVG polyline（グリッド線＋感情色ドット）で代替。実装時は Recharts に置き換え、ドット色は emotion カラーを series に割り当てる
