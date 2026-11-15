import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const fields = pgTable("fields", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cropType: text("crop_type"),
  polygonId: text("polygon_id"),
  coordinates: jsonb("coordinates").notNull(),
});
