import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  gameJson: text("game_json").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const audioAssets = sqliteTable("audio_assets", {
  id: text("id").primaryKey(),
  objectKey: text("object_key").notNull(),
  metadataJson: text("metadata_json").notNull(),
  createdAt: text("created_at").notNull()
});
