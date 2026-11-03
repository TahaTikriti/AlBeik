import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_menu_items_tags" ADD VALUE 'vegan' BEFORE 'popular';
  ALTER TYPE "public"."enum__menu_items_v_version_tags" ADD VALUE 'vegan' BEFORE 'popular';
  ALTER TABLE "menu_items" ADD COLUMN "combo_price" numeric;
  ALTER TABLE "_menu_items_v" ADD COLUMN "version_combo_price" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Tags of the removed value would fail the type change: drop them first.
  await db.execute(sql`
   DELETE FROM "menu_items_tags" WHERE "value" = 'vegan';
  DELETE FROM "_menu_items_v_version_tags" WHERE "value" = 'vegan';
  ALTER TABLE "menu_items_tags" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_menu_items_tags";
  CREATE TYPE "public"."enum_menu_items_tags" AS ENUM('spicy', 'vegetarian', 'popular', 'new', 'signature');
  ALTER TABLE "menu_items_tags" ALTER COLUMN "value" SET DATA TYPE "public"."enum_menu_items_tags" USING "value"::"public"."enum_menu_items_tags";
  ALTER TABLE "_menu_items_v_version_tags" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__menu_items_v_version_tags";
  CREATE TYPE "public"."enum__menu_items_v_version_tags" AS ENUM('spicy', 'vegetarian', 'popular', 'new', 'signature');
  ALTER TABLE "_menu_items_v_version_tags" ALTER COLUMN "value" SET DATA TYPE "public"."enum__menu_items_v_version_tags" USING "value"::"public"."enum__menu_items_v_version_tags";
  ALTER TABLE "menu_items" DROP COLUMN "combo_price";
  ALTER TABLE "_menu_items_v" DROP COLUMN "version_combo_price";`)
}
