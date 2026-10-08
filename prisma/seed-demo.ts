// デモアカウントに、動作確認用のサンプル記録を入れる(入れ直す)スクリプト。
//   npm run seed:demo           … ログ・タグだけ入れる（AI は呼ばない）
//   npm run seed:demo -- --ai   … さらに直近のログの AI 分析・ブログ下書き・1週間のインサイトも Gemini で作る
//
// 先に Supabase の管理画面で、デモ用のユーザーを「Auto Confirm User」付きで作っておくこと。
// 実行するとデモユーザーの記録・タグ・AI 結果をすべて消してから入れ直すので、見に来た人が
// データを書き換えたあとに元へ戻すのにも使える。AI 生成の回数(ai_usages)もリセットされる
import { prisma } from "../lib/prisma";
import { analyzeLog, toAnalyzeLogInput } from "../lib/ai/analyze-log";
import { generateBlogDraft } from "../lib/ai/blog-draft";
import { generateInsight } from "../lib/ai/insight";
import { startOfUTCDay } from "../lib/date";
import { buildInsightInput } from "../app/(app)/analytics/insight-input";
import { getPeriodStart } from "../app/(app)/analytics/period";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "test@example.com";
const WITH_AI = process.argv.includes("--ai");
// AI 分析まで作るのは直近の何件か（無料枠を使いすぎないよう少なめ）
const AI_ANALYZE_COUNT = 5;

type DemoLog = {
  daysAgo: number;
  mood: "fun" | "normal" | "sad" | "frustrate";
  tags: string[];
  didToday: string;
  goodThing: string;
  badThing: string | null;
  tomorrowPlan: string;
};

// 14日前〜昨日の記録（今日は空けておき、ホームの「今日はまだ記録がありません」も見られるようにする）。
// 4日前と11日前は記録なしにして、カレンダーの空き日・連続記録の途切れも確認できるようにしている
const DEMO_LOGS: DemoLog[] = [
  {
    daysAgo: 14,
    mood: "normal",
    tags: ["FF14", "日課"],
    didToday: "ルーレットと日課を消化した",
    goodThing: "初見さんがいるIDで丁寧に案内できた",
    badThing: null,
    tomorrowPlan: "零式の予習動画を見る",
  },
  {
    daysAgo: 13,
    mood: "frustrate",
    tags: ["FF14", "零式"],
    didToday: "零式1層に野良で挑戦した",
    goodThing: "前半のギミックは安定してきた",
    badThing: "後半の範囲で自分のミスが続いてワイプ",
    tomorrowPlan: "苦手なギミックだけ練習する",
  },
  {
    daysAgo: 12,
    mood: "fun",
    tags: ["FF14", "零式"],
    didToday: "零式1層をクリアした",
    goodThing: "昨日練習したところを一度もミスしなかった",
    badThing: null,
    tomorrowPlan: "2層の予習",
  },
  {
    daysAgo: 10,
    mood: "sad",
    tags: ["FF14", "零式"],
    didToday: "2層に3時間通った",
    goodThing: "最後は初めて時間切れまで行けた",
    badThing: "解散続きで、まとまって練習できなかった",
    tomorrowPlan: "固定募集を探してみる",
  },
  {
    daysAgo: 9,
    mood: "normal",
    tags: ["モンハン"],
    didToday: "気分転換にモンハンで素材集め",
    goodThing: "欲しかった素材が一発で出た",
    badThing: null,
    tomorrowPlan: "零式に戻る",
  },
  {
    daysAgo: 8,
    mood: "frustrate",
    tags: ["FF14", "零式"],
    didToday: "2層の練習PTに参加した",
    goodThing: "同じところで詰まっている人と話せた",
    badThing: "途中で回線が落ちてPTに迷惑をかけた",
    tomorrowPlan: "ルーターを再起動しておく",
  },
  {
    daysAgo: 7,
    mood: "fun",
    tags: ["FF14", "零式"],
    didToday: "零式2層をクリアした",
    goodThing: "練習PTのメンバーとそのままクリアできた",
    badThing: null,
    tomorrowPlan: "装備を整える",
  },
  {
    daysAgo: 6,
    mood: "normal",
    tags: ["FF14", "日課"],
    didToday: "トークン集めと日課",
    goodThing: "新しい武器と交換できた",
    badThing: "ルーレットのマッチングが長かった",
    tomorrowPlan: "3層の予習",
  },
  {
    daysAgo: 5,
    mood: "fun",
    tags: ["スプラ"],
    didToday: "友達とスプラでナワバリ",
    goodThing: "4連勝してみんなで盛り上がった",
    badThing: null,
    tomorrowPlan: "零式3層に挑戦",
  },
  {
    daysAgo: 3,
    mood: "frustrate",
    tags: ["FF14", "零式"],
    didToday: "零式3層に初挑戦",
    goodThing: "前半は1回で覚えられた",
    badThing: "後半の処理が分からず、何度も床をなめた",
    tomorrowPlan: "攻略記事を読む",
  },
  {
    daysAgo: 2,
    mood: "normal",
    tags: ["FF14", "零式"],
    didToday: "3層の練習を2時間",
    goodThing: "後半の処理の意味がやっと分かった",
    badThing: "集中が切れて最後はミスが増えた",
    tomorrowPlan: "短めに区切って練習する",
  },
  {
    daysAgo: 1,
    mood: "fun",
    tags: ["FF14", "零式"],
    didToday: "零式3層を野良でクリアした",
    goodThing: "3回目でギミック処理が完璧に決まった",
    badThing: "途中でタンクが抜けて30分待った",
    tomorrowPlan: "4層の予習をする",
  },
];

async function findDemoUserId(): Promise<string> {
  // 間違って本物のユーザーのデータを消さないよう、デモ用ドメインのアドレス以外では動かさない
  if (!DEMO_EMAIL.endsWith("@example.com")) {
    throw new Error(`DEMO_EMAIL は @example.com のアドレスにしてください: ${DEMO_EMAIL}`);
  }
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    select id::text as id from auth.users where email = ${DEMO_EMAIL}
  `;
  if (rows.length === 0) {
    throw new Error(
      `${DEMO_EMAIL} のユーザーが見つかりません。Supabase の管理画面で先に作成してください`,
    );
  }
  return rows[0].id;
}

async function resetDemoData(userId: string) {
  // ログを消すと log_tags・ai_summaries も onDelete: Cascade で消える
  await prisma.$transaction([
    prisma.log.deleteMany({ where: { userId } }),
    prisma.tag.deleteMany({ where: { userId } }),
    prisma.insight.deleteMany({ where: { userId } }),
    prisma.aiUsage.deleteMany({ where: { userId } }),
  ]);
}

async function insertDemoLogs(userId: string) {
  const emotions = await prisma.emotion.findMany();
  const emotionId = new Map(emotions.map((e) => [e.code, e.id]));

  const tagNames = [...new Set(DEMO_LOGS.flatMap((log) => log.tags))];
  await prisma.tag.createMany({ data: tagNames.map((name) => ({ userId, name })) });
  const tags = await prisma.tag.findMany({ where: { userId } });
  const tagId = new Map(tags.map((t) => [t.name, t.id]));

  const today = startOfUTCDay(new Date());
  for (const log of DEMO_LOGS) {
    const loggedDate = new Date(today);
    loggedDate.setUTCDate(loggedDate.getUTCDate() - log.daysAgo);
    await prisma.log.create({
      data: {
        userId,
        emotionId: emotionId.get(log.mood),
        didToday: log.didToday,
        goodThing: log.goodThing,
        badThing: log.badThing,
        tomorrowPlan: log.tomorrowPlan,
        loggedDate,
        tags: { create: log.tags.map((name) => ({ tagId: tagId.get(name)! })) },
      },
    });
  }
}

// AI の部分は混雑などで失敗しても、そこで止めずに続ける（ログ自体は入っているので）
async function generateDemoAi(userId: string) {
  const recentLogs = await prisma.log.findMany({
    where: { userId },
    include: { emotion: true, tags: { include: { tag: true } } },
    orderBy: { loggedDate: "desc" },
    take: AI_ANALYZE_COUNT,
  });

  for (const log of recentLogs) {
    try {
      const analysis = await analyzeLog(toAnalyzeLogInput(log));
      await prisma.aiSummary.create({
        data: { logId: log.id, ...analysis, generatedAt: new Date() },
      });
      console.log(`  分析: ${log.loggedDate.toISOString().slice(0, 10)} ${analysis.summary}`);
    } catch (error) {
      console.warn(`  分析をスキップ: ${log.loggedDate.toISOString().slice(0, 10)}`, error);
    }
  }

  // 一番新しいログにはブログ下書きも付けておく
  const latest = recentLogs[0];
  const latestSummary =
    latest && (await prisma.aiSummary.findUnique({ where: { logId: latest.id } }));
  if (latest && latestSummary) {
    try {
      const blogDraft = await generateBlogDraft(toAnalyzeLogInput(latest), latestSummary);
      await prisma.aiSummary.update({ where: { logId: latest.id }, data: { blogDraft } });
      console.log("  ブログ下書き: 作成しました");
    } catch (error) {
      console.warn("  ブログ下書きをスキップ", error);
    }
  }

  // 分析画面とホームに出る、直近1週間のインサイト
  try {
    const periodDays = 7;
    const weekLogs = await prisma.log.findMany({
      where: { userId, loggedDate: { gte: getPeriodStart(periodDays) } },
      include: { emotion: true, tags: { include: { tag: true } }, aiSummary: true },
      orderBy: { loggedDate: "asc" },
    });
    const content = await generateInsight(buildInsightInput(weekLogs, periodDays));
    await prisma.insight.create({ data: { userId, periodDays, content, generatedAt: new Date() } });
    console.log("  インサイト(1週間): 作成しました");
  } catch (error) {
    console.warn("  インサイトをスキップ", error);
  }
}

async function main() {
  const userId = await findDemoUserId();
  // 管理画面で作っただけのユーザーは public.users の行がまだ無いので作っておく
  await prisma.user.upsert({ where: { id: userId }, update: {}, create: { id: userId } });

  await resetDemoData(userId);
  await insertDemoLogs(userId);
  console.log(`${DEMO_EMAIL} に ${DEMO_LOGS.length} 件の記録を入れました`);

  if (WITH_AI) {
    console.log(
      "AI 分析・ブログ下書き・インサイトを作成します（Gemini を呼ぶので少し時間がかかります）",
    );
    await generateDemoAi(userId);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
