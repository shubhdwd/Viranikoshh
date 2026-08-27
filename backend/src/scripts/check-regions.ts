import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const regions = await prisma.region.findMany({ select: { id: true, name: true, state: true } });
  console.log("=== Regions ===");
  for (const r of regions) console.log(`  id=${r.id}  name=${r.name}  state=${r.state}`);

  const counts = await prisma.culturalPost.groupBy({
    by: ["regionId"],
    _count: { id: true },
    where: { published: true },
    orderBy: { _count: { id: "desc" } },
  });
  console.log("\n=== Posts per region ===");
  const regionMap: Record<string, string> = {};
  for (const r of regions) regionMap[r.id] = `${r.name} (${r.state})`;
  for (const c of counts) {
    const name = c.regionId ? (regionMap[c.regionId] ?? "UNKNOWN") : "NULL (no region)";
    console.log(`  ${name}: ${c._count.id} posts`);
  }
  console.log(`\nTotal published: ${counts.reduce((s, c) => s + c._count.id, 0)}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
