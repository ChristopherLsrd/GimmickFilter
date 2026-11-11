'use strict';
const { escapeHtml } = require('./html');
const { t, tCount, resolveLocale } = require('./i18n');
const { DISPOSITIONS, MATCH_MODES } = require('../domain/filterCriteria');

const PLUGIN_ID = 'gimmick-filter';

function button({ action, arg, label, cls = 'gf-btn', on = false, disabled = false, input }) {
  const attrs = ['type="button"', `class="${cls}${on ? ' gf-on' : ''}"`, `data-gf-action="${escapeHtml(action)}"`];
  if (arg !== undefined && arg !== null) attrs.push(`data-gf-arg="${escapeHtml(arg)}"`);
  if (input) attrs.push(`data-gf-input="${escapeHtml(input)}"`);
  if (on) attrs.push('aria-pressed="true"');
  if (disabled) attrs.push('disabled');
  return `<button ${attrs.join(' ')}>${escapeHtml(label)}</button>`;
}

function label(locale, key) {
  return `<span class="gf-label">${escapeHtml(t(locale, key))}</span>`;
}

function presetRow(panel, locale) {
  const options = [`<option value="">${escapeHtml(t(locale, 'panel.presetNone'))}</option>`]
    .concat(panel.presets.map((name) => {
      const selected = name === panel.activePreset;
      const text = selected && panel.dirty ? `${name}*` : name;
      return `<option value="${escapeHtml(name)}"${selected ? ' selected' : ''}>${escapeHtml(text)}</option>`;
    }));
  return '<div class="gf-row gf-presets">'
    + label(locale, 'panel.preset')
    + `<select class="gf-select" data-gf-change="applyPreset">${options.join('')}</select>`
    + button({ action: 'openSave', label: t(locale, 'panel.save') })
    + button({ action: 'deletePreset', label: t(locale, 'panel.delete'), disabled: !panel.activePreset })
    + button({ action: 'reset', label: t(locale, 'panel.reset') })
    + '</div>';
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

function chipRow(locale, labelKey, action, effects, active, blocked, activeClass) {
  const chips = effects.map((effect) => {
    const on = active.includes(effect);
    return button({
      action,
      arg: effect,
      label: effect,
      cls: `gf-chip${on ? ` ${activeClass}` : ''}`,
      on,
      disabled: blocked.includes(effect),
    });
  });
  return `<div class="gf-row gf-chips">${label(locale, labelKey)}${chips.join('')}</div>`;
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
  return `<div class="gf-panel" data-plugin-id="${PLUGIN_ID}" lang="${resolveLocale(locale)}">`
    + presetRow(panel, locale)
    + saveRow(panel.saveForm, locale)
    + '<div class="gf-row">'
    + segmented(locale, 'panel.disposition', 'setDisposition', DISPOSITIONS, criteria.disposition, 'disposition')
    + segmented(locale, 'panel.match', 'setMatch', MATCH_MODES, criteria.match, 'match')
    + '</div>'
    + chipRow(locale, 'panel.include', 'toggleInclude', panel.effects, criteria.include, criteria.exclude, 'gf-inc')
    + chipRow(locale, 'panel.exclude', 'toggleExclude', panel.effects, criteria.exclude, criteria.include, 'gf-exc')
    + countLine(panel.counts, locale)
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
