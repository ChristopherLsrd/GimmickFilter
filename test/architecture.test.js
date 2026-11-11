'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { violations } = require('./support/dependencyRule');

const SRC = path.join(__dirname, '..', 'src');

function listJs(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJs(full, base);
    return entry.name.endsWith('.js') ? [path.relative(base, full).split(path.sep).join('/')] : [];
  });
}

test('accepte un cas d\'usage qui importe le domaine', () => {
  assert.deepEqual(violations('application/GimmickListController.js', "require('../domain/presets');"), []);
});

test('refuse le domaine qui importe un adaptateur', () => {
  assert.equal(violations('domain/presets.js', "require('../adapters/SqlGimmickCatalog')").length, 1);
});

test('refuse l\'application qui importe la présentation', () => {
  assert.equal(violations('application/GimmickListController.js', "require('../presentation/panelHtml')").length, 1);
});

test('refuse un adaptateur qui importe un cas d\'usage ou un autre adaptateur', () => {
  assert.equal(violations('adapters/settingsPage.js', "require('../application/SettingsPageController')").length, 1);
  assert.equal(violations('adapters/settingsPage.js', "require('./styles')").length, 1);
});

test('accepte un adaptateur qui importe ports, domaine et présentation', () => {
  const source = "require('../application/ports'); require('../domain/gimmick'); require('../presentation/panelHtml');";
  assert.deepEqual(violations('adapters/gimmickListWatcher.js', source), []);
});

test('refuse tout module non relatif, même node:', () => {
  assert.equal(violations('adapters/SqlSaveIdentity.js', "require('node:crypto')").length, 1);
});

test('tous les fichiers de src respectent la règle de dépendance', () => {
  const errors = listJs(SRC).flatMap((rel) => violations(rel, fs.readFileSync(path.join(SRC, rel), 'utf8')));
  assert.deepEqual(errors, []);
});
