import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_web_orders_status" AS ENUM('pending', 'paid', 'declined', 'review', 'stopped');
  CREATE TYPE "public"."enum_web_orders_print_status" AS ENUM('requested', 'unconfirmed', 'not-requested');
  CREATE TABLE "web_orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"attempt_id" varchar NOT NULL,
  	"status" "enum_web_orders_status" DEFAULT 'pending' NOT NULL,
  	"print_status" "enum_web_orders_print_status" DEFAULT 'not-requested' NOT NULL,
  	"pickup_name" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"total_cents" numeric,
  	"lines" jsonb,
  	"ready_at" timestamp(3) with time zone,
  	"clover_order_id" varchar,
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "checkout_steps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"attempt_id" varchar NOT NULL,
  	"step" varchar NOT NULL,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "web_orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "checkout_steps_id" integer;
  CREATE UNIQUE INDEX "web_orders_attempt_id_idx" ON "web_orders" USING btree ("attempt_id");
  CREATE INDEX "web_orders_ip_hash_idx" ON "web_orders" USING btree ("ip_hash");
  CREATE INDEX "web_orders_updated_at_idx" ON "web_orders" USING btree ("updated_at");
  CREATE INDEX "web_orders_created_at_idx" ON "web_orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "checkout_steps_key_idx" ON "checkout_steps" USING btree ("key");
  CREATE INDEX "checkout_steps_attempt_id_idx" ON "checkout_steps" USING btree ("attempt_id");
  CREATE INDEX "checkout_steps_updated_at_idx" ON "checkout_steps" USING btree ("updated_at");
  CREATE INDEX "checkout_steps_created_at_idx" ON "checkout_steps" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_web_orders_fk" FOREIGN KEY ("web_orders_id") REFERENCES "public"."web_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_checkout_steps_fk" FOREIGN KEY ("checkout_steps_id") REFERENCES "public"."checkout_steps"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_web_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("web_orders_id");
  CREATE INDEX "payload_locked_documents_rels_checkout_steps_id_idx" ON "payload_locked_documents_rels" USING btree ("checkout_steps_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "web_orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "checkout_steps" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "web_orders" CASCADE;
  DROP TABLE "checkout_steps" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_web_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_checkout_steps_fk";
  
  DROP INDEX "payload_locked_documents_rels_web_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_checkout_steps_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "web_orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "checkout_steps_id";
  DROP TYPE "public"."enum_web_orders_status";
  DROP TYPE "public"."enum_web_orders_print_status";`)
}
