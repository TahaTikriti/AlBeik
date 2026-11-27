import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "menu_items_pickup_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"clover_item_id" varchar
  );
  
  CREATE TABLE "_menu_items_v_version_pickup_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"clover_item_id" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "online_pickup" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "prep_minutes" numeric DEFAULT 20;
  ALTER TABLE "site_settings" ADD COLUMN "order_alert_email" varchar;
  ALTER TABLE "menu_items_pickup_options" ADD CONSTRAINT "menu_items_pickup_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_menu_items_v_version_pickup_options" ADD CONSTRAINT "_menu_items_v_version_pickup_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_items_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menu_items_pickup_options_order_idx" ON "menu_items_pickup_options" USING btree ("_order");
  CREATE INDEX "menu_items_pickup_options_parent_id_idx" ON "menu_items_pickup_options" USING btree ("_parent_id");
  CREATE INDEX "_menu_items_v_version_pickup_options_order_idx" ON "_menu_items_v_version_pickup_options" USING btree ("_order");
  CREATE INDEX "_menu_items_v_version_pickup_options_parent_id_idx" ON "_menu_items_v_version_pickup_options" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "menu_items_pickup_options" CASCADE;
  DROP TABLE "_menu_items_v_version_pickup_options" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "online_pickup";
  ALTER TABLE "site_settings" DROP COLUMN "prep_minutes";
  ALTER TABLE "site_settings" DROP COLUMN "order_alert_email";`)
}
