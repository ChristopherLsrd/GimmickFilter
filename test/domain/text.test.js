'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compareNames, cleanStringList } = require('../../src/domain/text');

test('compareNames trie sans tenir compte de la casse', () => {
  assert.deepEqual(['badass', 'Athlete', 'cocky'].sort(compareNames), ['Athlete', 'badass', 'cocky']);
});

test('compareNames départage deux noms égaux à la casse près', () => {
  assert.notEqual(compareNames('Cocky', 'cocky'), 0);
});

test('cleanStringList nettoie, dédoublonne et trie', () => {
  assert.deepEqual(cleanStringList([' Match Boost', 'Added Cost', '', 3, null, 'Match Boost']), ['Added Cost', 'Match Boost']);
});

test('cleanStringList renvoie une liste vide pour une valeur qui n\'est pas un tableau', () => {
  assert.deepEqual(cleanStringList('Match Boost'), []);
  assert.deepEqual(cleanStringList(undefined), []);
});
