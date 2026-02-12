-- AlterTable
ALTER TABLE "RoutineDayExercise" ADD COLUMN     "isBodyweight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supersetGroupId" TEXT,
ADD COLUMN     "targetReps" INTEGER,
ADD COLUMN     "targetSets" INTEGER,
ADD COLUMN     "targetWeightKg" DECIMAL(8,3);
