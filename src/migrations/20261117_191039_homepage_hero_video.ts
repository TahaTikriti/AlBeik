import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" ADD COLUMN "hero_video_id" integer;
  ALTER TABLE "homepage" ADD COLUMN "hero_video_cover_id" integer;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_hero_video_id" integer;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_hero_video_cover_id" integer;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_video_cover_id_media_id_fk" FOREIGN KEY ("hero_video_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_video_id_media_id_fk" FOREIGN KEY ("version_hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_video_cover_id_media_id_fk" FOREIGN KEY ("version_hero_video_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "homepage_hero_hero_video_idx" ON "homepage" USING btree ("hero_video_id");
  CREATE INDEX "homepage_hero_hero_video_cover_idx" ON "homepage" USING btree ("hero_video_cover_id");
  CREATE INDEX "_homepage_v_version_hero_version_hero_video_idx" ON "_homepage_v" USING btree ("version_hero_video_id");
  CREATE INDEX "_homepage_v_version_hero_version_hero_video_cover_idx" ON "_homepage_v" USING btree ("version_hero_video_cover_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" DROP CONSTRAINT "homepage_hero_video_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_hero_video_cover_id_media_id_fk";
  
  ALTER TABLE "_homepage_v" DROP CONSTRAINT "_homepage_v_version_hero_video_id_media_id_fk";
  
  ALTER TABLE "_homepage_v" DROP CONSTRAINT "_homepage_v_version_hero_video_cover_id_media_id_fk";
  
  DROP INDEX "homepage_hero_hero_video_idx";
  DROP INDEX "homepage_hero_hero_video_cover_idx";
  DROP INDEX "_homepage_v_version_hero_version_hero_video_idx";
  DROP INDEX "_homepage_v_version_hero_version_hero_video_cover_idx";
  ALTER TABLE "homepage" DROP COLUMN "hero_video_id";
  ALTER TABLE "homepage" DROP COLUMN "hero_video_cover_id";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_hero_video_id";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_hero_video_cover_id";`)
}
