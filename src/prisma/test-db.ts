import "dotenv/config";
import { db } from "./db.js";

const main = async () => {
  const user = await db.orm.public.User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: null,
    avatar: null,
    emailVerified: false,
  });

  console.log("Created user:", user);
};

main().catch((error) => {
  console.error("Database test failed:", error);
  process.exit(1);
});