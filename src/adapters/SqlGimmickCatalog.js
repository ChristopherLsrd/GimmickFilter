'use strict';
const { toGimmick } = require('../domain/gimmick');

const SQL = 'SELECT name, modifiers, dispositionPreference FROM gimmicks ORDER BY name';

function createSqlGimmickCatalog(query) {
  return {
    loadGimmicks() {
      const rows = query(SQL, []);
      if (!Array.isArray(rows)) return [];
      const seen = new Set();
      const gimmicks = [];
      for (const row of rows) {
        const gimmick = toGimmick(row);
        if (!gimmick || seen.has(gimmick.name)) continue;
        seen.add(gimmick.name);
        gimmicks.push(gimmick);
      }
      return gimmicks;
    },
  };
}

module.exports = { createSqlGimmickCatalog, SQL };
