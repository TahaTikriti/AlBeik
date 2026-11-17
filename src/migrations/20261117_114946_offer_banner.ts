import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The home page's promo strip becomes a site-wide offer banner in Site settings,
// with start and end dates. Any promo already written moves across.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "banner_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "banner_text" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "banner_link_label" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "banner_link_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "banner_starts_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "banner_ends_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "banner_countdown_to" timestamp(3) with time zone;
  UPDATE "site_settings" SET
    "banner_enabled" = h."promo_enabled",
    "banner_text" = h."promo_text",
    "banner_link_label" = h."promo_link_label",
    "banner_link_url" = h."promo_link_url",
    "banner_countdown_to" = h."promo_countdown_to"
  FROM (SELECT * FROM "homepage" LIMIT 1) h;
  ALTER TABLE "homepage" DROP COLUMN "promo_enabled";
  ALTER TABLE "homepage" DROP COLUMN "promo_text";
  ALTER TABLE "homepage" DROP COLUMN "promo_link_label";
  ALTER TABLE "homepage" DROP COLUMN "promo_link_url";
  ALTER TABLE "homepage" DROP COLUMN "promo_countdown_to";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_promo_enabled";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_promo_text";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_promo_link_label";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_promo_link_url";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_promo_countdown_to";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" ADD COLUMN "promo_enabled" boolean DEFAULT false;
  ALTER TABLE "homepage" ADD COLUMN "promo_text" varchar;
  ALTER TABLE "homepage" ADD COLUMN "promo_link_label" varchar;
  ALTER TABLE "homepage" ADD COLUMN "promo_link_url" varchar;
  ALTER TABLE "homepage" ADD COLUMN "promo_countdown_to" timestamp(3) with time zone;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_promo_enabled" boolean DEFAULT false;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_promo_text" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_promo_link_label" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_promo_link_url" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_promo_countdown_to" timestamp(3) with time zone;
  UPDATE "homepage" SET
    "promo_enabled" = s."banner_enabled",
    "promo_text" = s."banner_text",
    "promo_link_label" = s."banner_link_label",
    "promo_link_url" = s."banner_link_url",
    "promo_countdown_to" = s."banner_countdown_to"
  FROM (SELECT * FROM "site_settings" LIMIT 1) s;
  ALTER TABLE "site_settings" DROP COLUMN "banner_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "banner_text";
  ALTER TABLE "site_settings" DROP COLUMN "banner_link_label";
  ALTER TABLE "site_settings" DROP COLUMN "banner_link_url";
  ALTER TABLE "site_settings" DROP COLUMN "banner_starts_at";
  ALTER TABLE "site_settings" DROP COLUMN "banner_ends_at";
  ALTER TABLE "site_settings" DROP COLUMN "banner_countdown_to";`)
}
