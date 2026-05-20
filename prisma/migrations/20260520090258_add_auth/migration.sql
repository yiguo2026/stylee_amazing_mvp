/*
  Warnings:

  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT '用户',
    "gender" TEXT NOT NULL DEFAULT 'female',
    "age" INTEGER,
    "profession" TEXT,
    "permanent_city" TEXT,
    "avatar_url" TEXT,
    "body_shape" TEXT,
    "skin_tone" TEXT,
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("age", "avatar_url", "body_shape", "created_at", "gender", "id", "nickname", "onboarding_done", "permanent_city", "profession", "skin_tone", "updated_at") SELECT "age", "avatar_url", "body_shape", "created_at", "gender", "id", "nickname", "onboarding_done", "permanent_city", "profession", "skin_tone", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
