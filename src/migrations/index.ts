import * as migration_20261013_164028_initial from './20261013_164028_initial';
import * as migration_20261013_170630_drafts_autosave from './20261013_170630_drafts_autosave';
import * as migration_20261029_171215_category_description from './20261029_171215_category_description';
import * as migration_20261103_082923_menu_combo_price_vegan from './20261103_082923_menu_combo_price_vegan';
import * as migration_20261117_114946_offer_banner from './20261117_114946_offer_banner';
import * as migration_20261117_161521_menu_sizes_deal_price from './20261117_161521_menu_sizes_deal_price';
import * as migration_20261117_181637_media_blob_storage from './20261117_181637_media_blob_storage';
import * as migration_20261117_191039_homepage_hero_video from './20261117_191039_homepage_hero_video';
import * as migration_20261124_124050_clover_pickup_url from './20261124_124050_clover_pickup_url';
import * as migration_20261127_160829_web_orders from './20261127_160829_web_orders';

export const migrations = [
  {
    up: migration_20261013_164028_initial.up,
    down: migration_20261013_164028_initial.down,
    name: '20261013_164028_initial',
  },
  {
    up: migration_20261013_170630_drafts_autosave.up,
    down: migration_20261013_170630_drafts_autosave.down,
    name: '20261013_170630_drafts_autosave',
  },
  {
    up: migration_20261029_171215_category_description.up,
    down: migration_20261029_171215_category_description.down,
    name: '20261029_171215_category_description',
  },
  {
    up: migration_20261103_082923_menu_combo_price_vegan.up,
    down: migration_20261103_082923_menu_combo_price_vegan.down,
    name: '20261103_082923_menu_combo_price_vegan',
  },
  {
    up: migration_20261117_114946_offer_banner.up,
    down: migration_20261117_114946_offer_banner.down,
    name: '20261117_114946_offer_banner',
  },
  {
    up: migration_20261117_161521_menu_sizes_deal_price.up,
    down: migration_20261117_161521_menu_sizes_deal_price.down,
    name: '20261117_161521_menu_sizes_deal_price',
  },
  {
    up: migration_20261117_181637_media_blob_storage.up,
    down: migration_20261117_181637_media_blob_storage.down,
    name: '20261117_181637_media_blob_storage',
  },
  {
    up: migration_20261117_191039_homepage_hero_video.up,
    down: migration_20261117_191039_homepage_hero_video.down,
    name: '20261117_191039_homepage_hero_video',
  },
  {
    up: migration_20261124_124050_clover_pickup_url.up,
    down: migration_20261124_124050_clover_pickup_url.down,
    name: '20261124_124050_clover_pickup_url',
  },
  {
    up: migration_20261127_160829_web_orders.up,
    down: migration_20261127_160829_web_orders.down,
    name: '20261127_160829_web_orders'
  },
];
