import { prisma } from "../utils/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: "logout-" } },
    select: { id: true, email: true },
  });
  if (users.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    console.log(`Deleted ${users.length} verification user(s).`);
  } else {
    console.log("No verification users to delete.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
