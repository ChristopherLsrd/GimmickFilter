'use strict';
const path = require('path');

const PLUGIN_DIR = __dirname + path.sep;

// Le jeu vide le cache du module principal au rechargement à chaud ; on vide aussi celui de src/.
function purgeModuleCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(PLUGIN_DIR) && key !== __filename) delete require.cache[key];
  }
}

let teardown = null;
let reinject = null;

module.exports = {
  activate(api) {
    purgeModuleCache();
    const { createStateRepository } = require('./src/application/stateRepository');
    const { createGimmickListController } = require('./src/application/GimmickListController');
    const { createSettingsPageController } = require('./src/application/SettingsPageController');
    const { createSqlGimmickCatalog } = require('./src/adapters/SqlGimmickCatalog');
    const { createSqlSaveIdentity } = require('./src/adapters/SqlSaveIdentity');
    const { createStoragePreferencesStore } = require('./src/adapters/StoragePreferencesStore');
    const { createGimmickListWatcher } = require('./src/adapters/gimmickListWatcher');
    const { createSettingsPage } = require('./src/adapters/settingsPage');
    const { CSS } = require('./src/adapters/styles');

    const logger = {
      log: (...args) => api.console.log(...args),
      error: (...args) => api.console.error(...args),
    };
    const query = (sql, params) => api.database.query(sql, params);
    const catalog = createSqlGimmickCatalog(query);
    const repository = createStateRepository({
      saveIdentity: createSqlSaveIdentity(query),
      store: createStoragePreferencesStore(api.storage),
      logger,
    });

    const watcher = createGimmickListWatcher({
      ui: api.ui, ipc: api.ipc, controller: createGimmickListController({ catalog, repository, logger }), logger, css: CSS,
    });
    const page = createSettingsPage({
      ui: api.ui, ipc: api.ipc, controller: createSettingsPageController({ catalog, repository, logger }), logger,
    });
    // Affectés avant le démarrage : si page.start() lève, deactivate peut quand même arrêter la surveillance.
    reinject = () => {
      watcher.reinject();
      page.reinject();
    };

    // Le jeu retire lui-même le DOM portant notre data-plugin-id ; watcher.stop() restaure les listes.
    teardown = () => {
      try { watcher.stop(); } catch (e) { logger.error('watcher.stop', e); }
      try { page.stop(); } catch (e) { logger.error('page.stop', e); }
    };

    watcher.start();
    page.start();

    logger.log('Gimmick Filter activé.');
  },

  onRendererLoad() {
    if (reinject) reinject();
  },

  deactivate() {
    if (!teardown) return;
    try { teardown(); } catch (e) { /* le jeu nettoie le reste */ }
    teardown = null;
    reinject = null;
  },
};
