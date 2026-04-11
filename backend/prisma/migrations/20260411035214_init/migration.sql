-- CreateTable
CREATE TABLE "Keyword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notify_email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Hotspot" (
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
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hotspot_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "Keyword" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hotspot_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sent_at" DATETIME,
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_hotspot_id_fkey" FOREIGN KEY ("hotspot_id") REFERENCES "Hotspot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" DATETIME,
    "status" TEXT NOT NULL,
    "keywords_count" INTEGER,
    "hotspots_found" INTEGER,
    "error" TEXT
);

-- CreateIndex
CREATE INDEX "Hotspot_keyword_id_idx" ON "Hotspot"("keyword_id");

-- CreateIndex
CREATE INDEX "Hotspot_created_at_idx" ON "Hotspot"("created_at");

-- CreateIndex
CREATE INDEX "Hotspot_is_fake_idx" ON "Hotspot"("is_fake");

-- CreateIndex
CREATE INDEX "Notification_hotspot_id_idx" ON "Notification"("hotspot_id");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "ScanLog_started_at_idx" ON "ScanLog"("started_at");
