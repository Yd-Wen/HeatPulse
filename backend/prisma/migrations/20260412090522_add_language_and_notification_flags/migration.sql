-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hotspot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "source_url" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "keyword_id" INTEGER,
    "relevance_score" REAL NOT NULL DEFAULT 0,
    "is_fake" BOOLEAN NOT NULL DEFAULT false,
    "ai_summary" TEXT,
    "ai_tags" TEXT,
    "importance" INTEGER,
    "language" TEXT,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hotspot_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "Keyword" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Hotspot" ("ai_summary", "ai_tags", "content", "created_at", "id", "importance", "is_fake", "keyword_id", "published_at", "relevance_score", "source_type", "source_url", "title") SELECT "ai_summary", "ai_tags", "content", "created_at", "id", "importance", "is_fake", "keyword_id", "published_at", "relevance_score", "source_type", "source_url", "title" FROM "Hotspot";
DROP TABLE "Hotspot";
ALTER TABLE "new_Hotspot" RENAME TO "Hotspot";
CREATE INDEX "Hotspot_keyword_id_idx" ON "Hotspot"("keyword_id");
CREATE INDEX "Hotspot_created_at_idx" ON "Hotspot"("created_at");
CREATE INDEX "Hotspot_is_fake_idx" ON "Hotspot"("is_fake");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
