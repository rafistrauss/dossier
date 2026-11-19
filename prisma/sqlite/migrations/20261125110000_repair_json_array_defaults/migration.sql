-- SQLite interprets the earlier unquoted [] defaults as empty strings.
-- Preserve saved arrays and repair only rows that received those defaults.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PostingSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT,
    "query" JSONB NOT NULL,
    "postings" JSONB NOT NULL DEFAULT '[]',
    "portals" JSONB NOT NULL DEFAULT '[]',
    "found" INTEGER NOT NULL DEFAULT 0,
    "next" TEXT,
    "agentSearchId" TEXT,
    "agentSearchName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostingSearch_agentSearchId_fkey" FOREIGN KEY ("agentSearchId") REFERENCES "AgentSearch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PostingSearch" ("id", "source", "query", "postings", "portals", "found", "next", "agentSearchId", "agentSearchName", "createdAt", "updatedAt")
SELECT "id", "source", "query", CASE WHEN "postings" = '' THEN '[]' ELSE "postings" END,
       CASE WHEN "portals" = '' THEN '[]' ELSE "portals" END, "found", "next", "agentSearchId", "agentSearchName", "createdAt", "updatedAt"
FROM "PostingSearch";
DROP TABLE "PostingSearch";
ALTER TABLE "new_PostingSearch" RENAME TO "PostingSearch";
CREATE INDEX "PostingSearch_createdAt_idx" ON "PostingSearch"("createdAt");
CREATE INDEX "PostingSearch_agentSearchId_idx" ON "PostingSearch"("agentSearchId");

CREATE TABLE "new_PortalCatalog" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "portals" JSONB NOT NULL DEFAULT '[]',
    "withdrawn" JSONB NOT NULL DEFAULT '[]',
    "commit" TEXT,
    "etag" TEXT,
    "readAt" DATETIME,
    "nextReadAt" DATETIME
);
INSERT INTO "new_PortalCatalog" ("id", "portals", "withdrawn", "commit", "etag", "readAt", "nextReadAt")
SELECT "id", CASE WHEN "portals" = '' THEN '[]' ELSE "portals" END,
       CASE WHEN "withdrawn" = '' THEN '[]' ELSE "withdrawn" END, "commit", "etag", "readAt", "nextReadAt"
FROM "PortalCatalog";
DROP TABLE "PortalCatalog";
ALTER TABLE "new_PortalCatalog" RENAME TO "PortalCatalog";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
