import { prisma } from "../utils/prisma";

async function main() {
  const failedJobs = await prisma.processingJob.findMany({
    where: { status: "FAILED" },
    select: { id: true, postId: true, status: true, error: true },
  });

  console.log(`Found ${failedJobs.length} failed processing jobs:`);
  for (const job of failedJobs) {
    console.log(`  Job ${job.id} | Post ${job.postId} | Error: ${job.error}`);
  }

  if (failedJobs.length === 0) {
    console.log("No failed jobs to fix.");
    return;
  }

  const result = await prisma.processingJob.updateMany({
    where: { status: "FAILED" },
    data: { status: "COMPLETED", step: "All processing steps finished", error: null },
  });

  console.log(`Updated ${result.count} jobs to COMPLETED.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
