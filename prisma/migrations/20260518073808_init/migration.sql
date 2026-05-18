-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable
CREATE TABLE "user_style_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,
    "tag_type" TEXT NOT NULL,
    "preference_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_style_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wardrobe_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "material" TEXT,
    "brand" TEXT,
    "price" REAL,
    "image_url" TEXT,
    "fit_type" TEXT,
    "season" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'manual',
    "ai_recognized_attrs" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "wear_count" INTEGER NOT NULL DEFAULT 0,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wardrobe_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "item_tags_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "wardrobe_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "recommendation_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "raw_query" TEXT,
    "nlp_keywords" TEXT,
    "city" TEXT NOT NULL DEFAULT '北京',
    "temperature" REAL NOT NULL DEFAULT 22,
    "weatherType" TEXT NOT NULL DEFAULT '晴',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "outfits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "name" TEXT,
    "ai_comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ai_generated',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "scene" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "outfits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outfits_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "recommendation_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "outfit_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfit_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "role" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "outfit_items_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outfit_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "wardrobe_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "extra_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_actions_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wear_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "outfit_id" TEXT NOT NULL,
    "wear_date" DATETIME NOT NULL,
    "weather" TEXT,
    "rating" INTEGER,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wear_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wear_events_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "item_tags_item_id_tag_id_key" ON "item_tags"("item_id", "tag_id");
