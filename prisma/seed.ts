import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Use TCP connection for seed script (prisma dev exposes this on port 51214)
const directUrl =
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";

const pool = new pg.Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultExercises = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-Up",
  "Chin-Up",
  "Dumbbell Curl",
  "Tricep Pushdown",
  "Lateral Raise",
  "Face Pull",
  "Leg Press",
  "Romanian Deadlift",
  "Lunges",
  "Calf Raise",
  "Plank",
];

async function main() {
  for (const name of defaultExercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name, isDefault: true, createdByUserId: null },
    });
    if (!existing) {
      await prisma.exercise.create({
        data: {
          name,
          isDefault: true,
          createdByUserId: null,
        },
      });
    }
  }

  console.log(`Seeded ${defaultExercises.length} default exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
