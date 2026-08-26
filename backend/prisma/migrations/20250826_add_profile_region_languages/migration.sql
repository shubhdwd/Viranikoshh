-- AlterTable: Add region and languages to profiles
ALTER TABLE "profiles" ADD COLUMN "region" TEXT;
ALTER TABLE "profiles" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
