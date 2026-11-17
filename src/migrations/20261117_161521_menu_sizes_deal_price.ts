import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "menu_items_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price" numeric
  );
  
  CREATE TABLE "_menu_items_v_version_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price" numeric,
  	"_uuid" varchar
  );
  
  ALTER TABLE "menu_items" ADD COLUMN "deal_price" numeric;
  ALTER TABLE "_menu_items_v" ADD COLUMN "version_deal_price" numeric;
  ALTER TABLE "menu_items_sizes" ADD CONSTRAINT "menu_items_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_menu_items_v_version_sizes" ADD CONSTRAINT "_menu_items_v_version_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_items_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menu_items_sizes_order_idx" ON "menu_items_sizes" USING btree ("_order");
  CREATE INDEX "menu_items_sizes_parent_id_idx" ON "menu_items_sizes" USING btree ("_parent_id");
  CREATE INDEX "_menu_items_v_version_sizes_order_idx" ON "_menu_items_v_version_sizes" USING btree ("_order");
  CREATE INDEX "_menu_items_v_version_sizes_parent_id_idx" ON "_menu_items_v_version_sizes" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "menu_items_sizes" CASCADE;
  DROP TABLE "_menu_items_v_version_sizes" CASCADE;
  ALTER TABLE "menu_items" DROP COLUMN "deal_price";
  ALTER TABLE "_menu_items_v" DROP COLUMN "version_deal_price";`)
}
