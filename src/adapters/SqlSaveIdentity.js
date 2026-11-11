'use strict';

const SQL = 'SELECT saveName, saveStartDate FROM saveinfo LIMIT 1';

function saveKey(saveName, saveStartDate) {
  const slug = String(saveName || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'save';
  const date = String(saveStartDate || '').replace(/[^0-9]/g, '') || 'nodate';
  return `${slug}_${date}`;
}

function createSqlSaveIdentity(query) {
  return {
    currentKey() {
      let rows;
      try {
        rows = query(SQL, []);
      } catch (e) {
        return null;
      }
      const row = Array.isArray(rows) ? rows[0] : null;
      return row ? saveKey(row.saveName, row.saveStartDate) : null;
    },
  };
}

module.exports = { createSqlSaveIdentity, saveKey, SQL };
