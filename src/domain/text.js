'use strict';

function compareNames(a, b) {
  const byLocale = String(a).localeCompare(String(b), 'en', { sensitivity: 'base' });
  if (byLocale !== 0) return byLocale;
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

function cleanStringList(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const text = item.trim();
    if (text) unique.add(text);
  }
  return [...unique].sort(compareNames);
}

module.exports = { compareNames, cleanStringList };
