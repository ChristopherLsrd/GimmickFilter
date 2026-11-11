'use strict';
const { escapeHtml } = require('./html');
const { t, resolveLocale } = require('./i18n');

const PLUGIN_ID = 'gimmick-filter';

function renderPageShell() {
  return `<div id="gf-page-root" class="gf-page" data-plugin-id="${PLUGIN_ID}"></div>`;
}

function checkbox(action, name, checked) {
  return `<input type="checkbox" data-gf-action="${action}" data-gf-name="${escapeHtml(name)}"${checked ? ' checked' : ''}>`;
}

function gimmickRow(g, locale) {
  const effects = g.effects.join(', ');
  const search = `${g.name} ${effects}`.toLowerCase();
  return `<tr data-gf-search="${escapeHtml(search)}">`
    + `<td>${escapeHtml(g.name)}</td>`
    + `<td>${escapeHtml(t(locale, `disposition.${g.disposition}`))}</td>`
    + `<td>${escapeHtml(effects)}</td>`
    + `<td>${checkbox('setPinned', g.name, g.pinned)}</td>`
    + `<td>${checkbox('setHidden', g.name, g.hidden)}</td>`
    + '</tr>';
}

function presetsSection(data, locale) {
  const error = data.error
    ? `<p class="gf-error">${escapeHtml(t(locale, `page.error.${data.error}`))}</p>`
    : '';
  const body = data.presets.length === 0
    ? `<p class="gf-muted">${escapeHtml(t(locale, 'page.presetsEmpty'))}</p>`
    : `<ul class="gf-preset-list">${data.presets.map((name) => '<li>'
      + `<input type="text" class="gf-rename-input" value="${escapeHtml(name)}" maxlength="60">`
      + `<button type="button" class="gf-btn button clickable secondaryButton" data-gf-action="renamePreset" data-gf-from="${escapeHtml(name)}">${escapeHtml(t(locale, 'page.rename'))}</button>`
      + `<button type="button" class="gf-btn button clickable secondaryButton" data-gf-action="deletePreset" data-gf-from="${escapeHtml(name)}">${escapeHtml(t(locale, 'page.delete'))}</button>`
      + '</li>').join('')}</ul>`;
  return `<section class="panel gf-page-presets"><h3>${escapeHtml(t(locale, 'page.presets'))}</h3>${error}${body}</section>`;
}

function gimmicksSection(data, locale) {
  const head = ['name', 'disposition', 'effects', 'pinned', 'hidden']
    .map((col) => `<th>${escapeHtml(t(locale, `page.col.${col}`))}</th>`).join('');
  const body = data.gimmicks.length === 0
    ? `<p class="gf-muted">${escapeHtml(t(locale, 'page.noGimmicks'))}</p>`
    : `<table class="gf-table"><thead><tr>${head}</tr></thead><tbody>`
      + `${data.gimmicks.map((g) => gimmickRow(g, locale)).join('')}</tbody></table>`;
  return `<section class="panel gf-page-gimmicks"><h3>${escapeHtml(t(locale, 'page.gimmicks'))}</h3>`
    + '<div class="gf-row">'
    + `<input type="search" class="gf-page-search" placeholder="${escapeHtml(t(locale, 'page.search'))}">`
    + `<button type="button" class="gf-btn button clickable secondaryButton" data-gf-action="unpinAll">${escapeHtml(t(locale, 'page.unpinAll'))}</button>`
    + `<button type="button" class="gf-btn button clickable secondaryButton" data-gf-action="unhideAll">${escapeHtml(t(locale, 'page.unhideAll'))}</button>`
    + `</div>${body}</section>`;
}

function renderSettingsPage(data, locale) {
  return `<div class="gf-page-inner" lang="${resolveLocale(locale)}">`
    + presetsSection(data, locale)
    + gimmicksSection(data, locale)
    + '</div>';
}

function renderNoSave(locale) {
  return `<div class="noResults">${escapeHtml(t(locale, 'page.noSave'))}</div>`;
}

module.exports = { renderPageShell, renderSettingsPage, renderNoSave };
