'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml } = require('../../src/presentation/html');

test('escapeHtml échappe les caractères spéciaux', () => {
  assert.equal(escapeHtml(`<a href="x">Tom & Jerry's</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
});

test('escapeHtml accepte null, undefined et les nombres', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(12), '12');
});
