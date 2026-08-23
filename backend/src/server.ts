import "dotenv/config";
import app from "./app";
import { prisma } from "./utils/prisma";

const PORT = process.env.PORT || 5000;

const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key] || process.env[key].trim() === "");
  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }
}

async function connectWithRetry(retries = 5, delay = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      // Verify the connection is actually usable with a lightweight query
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      console.error(`⚠️  Database connection attempt ${attempt}/${retries} failed`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function bootstrap() {
  try {
    validateEnv();
    await connectWithRetry();
    console.log("✅ Database connected successfully");
    console.log("✅ Environment variables validated");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
