CREATE TABLE "surgery_records" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"fecha" date,
	"data" jsonb NOT NULL,
	"deleted" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "surgery_records_user_idx" ON "surgery_records" ("user_id");--> statement-breakpoint
CREATE INDEX "surgery_records_user_fecha_idx" ON "surgery_records" ("user_id","fecha");--> statement-breakpoint
ALTER TABLE "surgery_records" ADD CONSTRAINT "surgery_records_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;