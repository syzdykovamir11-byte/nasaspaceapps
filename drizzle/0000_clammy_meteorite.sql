CREATE TABLE IF NOT EXISTS "fields" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"crop_type" text,
	"area" integer,
	"coordinates" jsonb NOT NULL
);
