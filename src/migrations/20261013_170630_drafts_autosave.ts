import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_menu_items_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_homepage_v" ADD COLUMN "autosave" boolean;
  CREATE INDEX "_menu_items_v_autosave_idx" ON "_menu_items_v" USING btree ("autosave");
  CREATE INDEX "_homepage_v_autosave_idx" ON "_homepage_v" USING btree ("autosave");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "_menu_items_v_autosave_idx";
  DROP INDEX "_homepage_v_autosave_idx";
  ALTER TABLE "_menu_items_v" DROP COLUMN "autosave";
  ALTER TABLE "_homepage_v" DROP COLUMN "autosave";`)
}
