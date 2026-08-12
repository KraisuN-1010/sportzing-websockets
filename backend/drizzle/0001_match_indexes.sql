CREATE INDEX IF NOT EXISTS "idx_matches_created_at" ON "matches" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_matches_sport_status" ON "matches" ("sport", "status");
