import * as migration_20261013_164028_initial from './20261013_164028_initial';
import * as migration_20261013_170630_drafts_autosave from './20261013_170630_drafts_autosave';
import * as migration_20261029_171215_category_description from './20261029_171215_category_description';
import * as migration_20261103_082923_menu_combo_price_vegan from './20261103_082923_menu_combo_price_vegan';

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
    name: '20261103_082923_menu_combo_price_vegan'
  },
];
