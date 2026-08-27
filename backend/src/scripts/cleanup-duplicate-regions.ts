import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Group regions by name, keep first ID, delete duplicates
  const regions = await prisma.region.findMany({ select: { id: true, name: true } });
  const byName = new Map<string, string[]>();
  for (const r of regions) {
    const list = byName.get(r.name) ?? [];
    list.push(r.id);
    byName.set(r.name, list);
  }

  let deleted = 0;
  for (const [name, ids] of byName) {
    if (ids.length <= 1) continue;
    const [keep, ...dups] = ids;
    console.log(`  ${name}: keeping ${keep}, deleting ${dups.length} duplicates`);

    // Move posts from duplicate IDs to the kept ID
    for (const dupId of dups) {
      const count = await prisma.culturalPost.updateMany({
        where: { regionId: dupId },
        data: { regionId: keep },
      });
      console.log(`    moved ${count.count} posts from ${dupId} → ${keep}`);
      await prisma.region.delete({ where: { id: dupId } });
      deleted++;
    }
  }

  console.log(`\nDeleted ${deleted} duplicate regions.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
