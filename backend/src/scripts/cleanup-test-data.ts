import { prisma } from "../utils/prisma";

const TEST_EMAIL_PREFIXES = [
  "e2etest",
  "audio-owner-",
  "audio-other-",
  "reval-admin-",
  "reval-user-",
  "revoke-",
  "del-",
];

const TEST_NAMES = [
  "E2E Tester",
  "Audio Owner",
  "Audio Other",
  "Future Admin",
  "Normal User",
  "Revoke Tester",
  "To Delete",
];

async function main() {
  console.log("Finding test users...\n");

  const allUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "@test.com" } },
        { name: { in: TEST_NAMES } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  const matched = allUsers.filter((u) => {
    const emailMatch = TEST_EMAIL_PREFIXES.some((prefix) => u.email.startsWith(prefix));
    const nameMatch = TEST_NAMES.includes(u.name);
    return emailMatch || nameMatch;
  });

  if (matched.length === 0) {
    console.log("No test users found.");
    return;
  }

  console.log(`Found ${matched.length} test user(s):`);
  matched.forEach((u) => console.log(`  - ${u.name} (${u.email}) [${u.id}]`));

  const userIds = matched.map((u) => u.id);

  console.log("\nDeleting test users and cascading related data...");
  const deleteResult = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  console.log(`Deleted ${deleteResult.count} user(s).`);

  // Clean up any orphaned posts with E2E test titles
  const orphanedPosts = await prisma.culturalPost.findMany({
    where: {
      title: { startsWith: "E2E Test Post " },
    },
    select: { id: true, title: true },
  });

  if (orphanedPosts.length > 0) {
    console.log(`\nFound ${orphanedPosts.length} orphaned E2E test post(s), deleting...`);
    for (const post of orphanedPosts) {
      await prisma.culturalPost.delete({ where: { id: post.id } });
      console.log(`  Deleted post: ${post.title}`);
    }
  } else {
    console.log("\nNo orphaned E2E test posts found.");
  }

  console.log("\nCleanup complete.");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
