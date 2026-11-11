'use strict';
const { escapeHtml } = require('./html');
const { t, tCount, resolveLocale } = require('./i18n');
const { DISPOSITIONS, MATCH_MODES } = require('../domain/filterCriteria');

const PLUGIN_ID = 'gimmick-filter';

function button({ action, arg, label, cls = 'gf-btn', on = false, disabled = false, input }) {
  // Les boutons d'action prennent le style natif du jeu (guide UI : classes button/clickable).
  const native = cls === 'gf-btn' ? (disabled ? ' button disabled' : ' button clickable secondaryButton') : '';
  const attrs = ['type="button"', `class="${cls}${native}${on ? ' gf-on' : ''}"`, `data-gf-action="${escapeHtml(action)}"`];
  if (arg !== undefined && arg !== null) attrs.push(`data-gf-arg="${escapeHtml(arg)}"`);
  if (input) attrs.push(`data-gf-input="${escapeHtml(input)}"`);
  if (on) attrs.push('aria-pressed="true"');
  if (disabled) attrs.push('disabled');
  return `<button ${attrs.join(' ')}>${escapeHtml(label)}</button>`;
}

function label(locale, key) {
  return `<span class="gf-label">${escapeHtml(t(locale, key))}</span>`;
}

function activeCount(criteria) {
  return (criteria.disposition !== 'all' ? 1 : 0) + (criteria.match !== 'all' ? 1 : 0)
    + criteria.include.length + criteria.exclude.length;
}

function barRow(panel, locale, n) {
  const options = [`<option value="">${escapeHtml(t(locale, 'panel.presetNone'))}</option>`]
    .concat(panel.presets.map((name) => {
      const selected = name === panel.activePreset;
      const text = selected && panel.dirty ? `${name}*` : name;
      return `<option value="${escapeHtml(name)}"${selected ? ' selected' : ''}>${escapeHtml(text)}</option>`;
    }));
  const toggleLabel = t(locale, 'panel.filters') + (n > 0 ? ` (${n})` : '');
  return '<div class="gf-row gf-bar">'
    + label(locale, 'panel.preset')
    + `<select class="gf-select" data-gf-change="applyPreset">${options.join('')}</select>`
    + `<button type="button" class="gf-btn gf-toggle button clickable secondaryButton" data-gf-toggle aria-expanded="false">${escapeHtml(toggleLabel)}</button>`
    + countLine(panel.counts, locale)
    + '</div>';
}

function actionsRow(panel, locale) {
  return '<div class="gf-row gf-presets">'
    + button({ action: 'openSave', label: t(locale, 'panel.save') })
    + button({ action: 'deletePreset', label: t(locale, 'panel.delete'), disabled: !panel.activePreset })
    + button({ action: 'reset', label: t(locale, 'panel.reset') })
    + '</div>';
}

function summaryRow(criteria, locale, n) {
  if (n === 0) return '';
  const chips = [];
  if (criteria.disposition !== 'all') {
    chips.push(button({ action: 'setDisposition', arg: 'all', label: `${t(locale, `disposition.${criteria.disposition}`)} ×`, cls: 'gf-chip gf-inc' }));
  }
  if (criteria.match !== 'all') {
    chips.push(button({ action: 'setMatch', arg: 'all', label: `${t(locale, `match.${criteria.match}`)} ×`, cls: 'gf-chip gf-inc' }));
  }
  criteria.include.forEach((effect) => chips.push(button({ action: 'toggleInclude', arg: effect, label: `${effect} ×`, cls: 'gf-chip gf-inc' })));
  criteria.exclude.forEach((effect) => chips.push(button({ action: 'toggleExclude', arg: effect, label: `${effect} ×`, cls: 'gf-chip gf-exc' })));
  return `<div class="gf-row gf-summary">${chips.join('')}</div>`;
}

function saveRow(form, locale) {
  if (!form) return '';
  if (form.mode === 'confirm') {
    return '<div class="gf-row gf-save">'
      + `<span>${escapeHtml(t(locale, 'panel.overwrite', { name: form.name }))}</span>`
      + button({ action: 'confirmSave', arg: form.name, label: t(locale, 'panel.overwriteButton') })
      + button({ action: 'cancelSave', label: t(locale, 'panel.cancel') })
      + '</div>';
  }
  const error = form.error === 'empty'
    ? `<span class="gf-error">${escapeHtml(t(locale, 'panel.nameRequired'))}</span>`
    : '';
  return '<div class="gf-row gf-save">'
    + `<input type="text" class="gf-preset-name" value="${escapeHtml(form.name)}" `
    + `placeholder="${escapeHtml(t(locale, 'panel.presetName'))}" maxlength="60">`
    + button({ action: 'savePreset', input: '.gf-preset-name', label: t(locale, 'panel.confirm') })
    + button({ action: 'cancelSave', label: t(locale, 'panel.cancel') })
    + error
    + '</div>';
}

function segmented(locale, labelKey, action, values, current, prefix) {
  const buttons = values.map((value) => button({
    action, arg: value, label: t(locale, `${prefix}.${value}`), cls: 'gf-seg-btn', on: value === current,
  }));
  return `${label(locale, labelKey)}<span class="gf-seg" role="group">${buttons.join('')}</span>`;
}

const VISIBLE_EFFECTS = 5;

// Effets triés par ordre alphabétique ; au repos, seuls les 5 premiers (et les effets actifs) sont visibles.
function chipRow(locale, labelKey, action, effects, active, blocked, activeClass, row) {
  const sorted = [...effects].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  const chips = sorted.map((effect, index) => {
    const on = active.includes(effect);
    const extra = index >= VISIBLE_EFFECTS && !on;
    return button({
      action,
      arg: effect,
      label: effect,
      cls: `gf-chip${on ? ` ${activeClass}` : ''}${extra ? ' gf-extra' : ''}`,
      on,
      disabled: blocked.includes(effect),
    });
  });
  const more = sorted.length > VISIBLE_EFFECTS
    ? '<button type="button" class="gf-btn gf-more button clickable secondaryButton" data-gf-more>'
      + `<span class="gf-more-label">${escapeHtml(t(locale, 'panel.showMore'))}</span>`
      + `<span class="gf-less-label">${escapeHtml(t(locale, 'panel.showLess'))}</span></button>`
    : '';
  return `<div class="gf-row gf-chips" data-gf-row="${row}">${label(locale, labelKey)}${chips.join('')}${more}</div>`;
}

function countLine(counts, locale) {
  const parts = [tCount(locale, 'count.shown', counts.shown)];
  if (counts.pinnedFiltered > 0) parts.push(tCount(locale, 'count.pinnedFiltered', counts.pinnedFiltered));
  if (counts.hiddenBySetting > 0) parts.push(tCount(locale, 'count.hidden', counts.hiddenBySetting));
  return `<div class="gf-count">${escapeHtml(parts.join(' · '))}</div>`;
}

function emptyBlock(counts, locale) {
  if (counts.shown > 0) return '';
  return `<div class="gf-empty">${escapeHtml(t(locale, 'panel.empty'))} `
    + `${button({ action: 'reset', label: t(locale, 'panel.reset') })}</div>`;
}

function renderPanel(panel) {
  const locale = panel.locale;
  const { criteria } = panel;
  const n = activeCount(criteria);
  return `<div class="gf-panel" data-plugin-id="${PLUGIN_ID}" lang="${resolveLocale(locale)}">`
    + barRow(panel, locale, n)
    + summaryRow(criteria, locale, n)
    + '<div class="gf-body">'
    + actionsRow(panel, locale)
    + saveRow(panel.saveForm, locale)
    + '<div class="gf-row">'
    + segmented(locale, 'panel.disposition', 'setDisposition', DISPOSITIONS, criteria.disposition, 'disposition')
    + segmented(locale, 'panel.match', 'setMatch', MATCH_MODES, criteria.match, 'match')
    + '</div>'
    + chipRow(locale, 'panel.include', 'toggleInclude', panel.effects, criteria.include, criteria.exclude, 'gf-inc', 'include')
    + chipRow(locale, 'panel.exclude', 'toggleExclude', panel.effects, criteria.exclude, criteria.include, 'gf-exc', 'exclude')
    + '</div>'
    + emptyBlock(panel.counts, locale)
    + '</div>';
}

function renderToast(name, locale) {
  return `<div class="gf-toast" data-plugin-id="${PLUGIN_ID}">`
    + `<span>${escapeHtml(t(locale, 'toast.hidden', { name }))}</span>`
    + button({ action: 'unhide', arg: name, label: t(locale, 'toast.undo') })
    + '</div>';
}

function cardLabels(locale) {
  return {
    pin: t(locale, 'card.pin'),
    unpin: t(locale, 'card.unpin'),
    hide: t(locale, 'card.hide'),
    forced: t(locale, 'card.forced'),
  };
}

module.exports = { renderPanel, renderToast, cardLabels };
