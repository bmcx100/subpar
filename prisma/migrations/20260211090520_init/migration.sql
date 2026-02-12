-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('LB', 'KG');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'active', 'past_due', 'canceled');

-- CreateEnum
CREATE TYPE "GolfBlock" AS ENUM ('NORMAL', 'STEP', 'MAX_NORMAL', 'DRIVER');

-- CreateEnum
CREATE TYPE "GolfStick" AS ENUM ('LIGHT', 'MEDIUM', 'HEAVY', 'DRIVER');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('DOMINANT', 'NON_DOMINANT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'LB',
    "incrementLb" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "incrementKg" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "timerSound" BOOLEAN NOT NULL DEFAULT true,
    "timerVibrate" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trial',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "GolfSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "GolfSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GolfValue" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "block" "GolfBlock" NOT NULL,
    "stick" "GolfStick" NOT NULL,
    "side" "Side" NOT NULL,
    "speedMphTenths" INTEGER NOT NULL,

    CONSTRAINT "GolfValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Routine',
    "sessionsPerWeek" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineDay" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Day',

    CONSTRAINT "RoutineDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineDayExercise" (
    "id" TEXT NOT NULL,
    "routineDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "RoutineDayExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrengthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routineDayId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "StrengthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrengthSet" (
    "id" TEXT NOT NULL,
    "strengthSessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "weightKg" DECIMAL(8,3) NOT NULL,
    "reps" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "StrengthSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "GolfSession_userId_performedAt_idx" ON "GolfSession"("userId", "performedAt");

-- CreateIndex
CREATE INDEX "GolfValue_sessionId_idx" ON "GolfValue"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GolfValue_sessionId_block_stick_side_key" ON "GolfValue"("sessionId", "block", "stick", "side");

-- CreateIndex
CREATE INDEX "Routine_userId_idx" ON "Routine"("userId");

-- CreateIndex
CREATE INDEX "RoutineDay_routineId_orderIndex_idx" ON "RoutineDay"("routineId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineDay_routineId_orderIndex_key" ON "RoutineDay"("routineId", "orderIndex");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_createdByUserId_idx" ON "Exercise"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_createdByUserId_name_key" ON "Exercise"("createdByUserId", "name");

-- CreateIndex
CREATE INDEX "RoutineDayExercise_routineDayId_orderIndex_idx" ON "RoutineDayExercise"("routineDayId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineDayExercise_routineDayId_exerciseId_key" ON "RoutineDayExercise"("routineDayId", "exerciseId");

-- CreateIndex
CREATE INDEX "StrengthSession_userId_performedAt_idx" ON "StrengthSession"("userId", "performedAt");

-- CreateIndex
CREATE INDEX "StrengthSession_routineDayId_idx" ON "StrengthSession"("routineDayId");

-- CreateIndex
CREATE INDEX "StrengthSet_strengthSessionId_idx" ON "StrengthSet"("strengthSessionId");

-- CreateIndex
CREATE INDEX "StrengthSet_exerciseId_idx" ON "StrengthSet"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "StrengthSet_strengthSessionId_exerciseId_setIndex_key" ON "StrengthSet"("strengthSessionId", "exerciseId", "setIndex");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GolfSession" ADD CONSTRAINT "GolfSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GolfValue" ADD CONSTRAINT "GolfValue_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GolfSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineDay" ADD CONSTRAINT "RoutineDay_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineDayExercise" ADD CONSTRAINT "RoutineDayExercise_routineDayId_fkey" FOREIGN KEY ("routineDayId") REFERENCES "RoutineDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineDayExercise" ADD CONSTRAINT "RoutineDayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthSession" ADD CONSTRAINT "StrengthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthSession" ADD CONSTRAINT "StrengthSession_routineDayId_fkey" FOREIGN KEY ("routineDayId") REFERENCES "RoutineDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthSet" ADD CONSTRAINT "StrengthSet_strengthSessionId_fkey" FOREIGN KEY ("strengthSessionId") REFERENCES "StrengthSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthSet" ADD CONSTRAINT "StrengthSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
