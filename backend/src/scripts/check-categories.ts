import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.culturalCategory.findMany({ select: { id: true, name: true } });
  console.log("=== Categories ===");
  for (const c of cats) console.log(`  id=${c.id}  name=${c.name}`);

  const counts = await prisma.culturalPost.groupBy({
    by: ["categoryId"],
    _count: { id: true },
    where: { published: true },
    orderBy: { _count: { id: "desc" } },
  });
  console.log("\n=== Posts per category ===");
  const catMap: Record<string, string> = {};
  for (const c of cats) catMap[c.id] = c.name;
  for (const c of counts) {
    const name = c.categoryId ? catMap[c.categoryId] : "NULL";
    console.log(`  ${name} (${c.categoryId}): ${c._count.id} posts`);
  }
  console.log(`\nTotal: ${counts.reduce((s, c) => s + c._count.id, 0)} posts`);

  const sample = await prisma.culturalPost.findMany({
    where: { published: true },
    select: { id: true, title: true, category: { select: { id: true, name: true } } },
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  console.log("\n=== Sample posts ===");
  for (const p of sample) {
    console.log(`  "${p.title}" -> category: ${p.category?.name ?? "NONE"} (${p.categoryId})`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
