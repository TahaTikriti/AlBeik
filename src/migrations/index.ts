import * as migration_20261013_164028_initial from './20261013_164028_initial';
import * as migration_20261013_170630_drafts_autosave from './20261013_170630_drafts_autosave';

export const migrations = [
  {
    up: migration_20261013_164028_initial.up,
    down: migration_20261013_164028_initial.down,
    name: '20261013_164028_initial',
  },
  {
    up: migration_20261013_170630_drafts_autosave.up,
    down: migration_20261013_170630_drafts_autosave.down,
    name: '20261013_170630_drafts_autosave'
  },
];
