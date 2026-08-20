import { prisma } from "../lib/prisma";

const emotions = [
  { code: "fun", label: "楽しい" },
  { code: "normal", label: "普通" },
  { code: "sad", label: "悲しい" },
  { code: "frustrate", label: "モヤモヤ" },
];

async function main() {
  for (const emotion of emotions) {
    await prisma.emotion.upsert({
      where: { code: emotion.code },
      update: { label: emotion.label },
      create: emotion,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
