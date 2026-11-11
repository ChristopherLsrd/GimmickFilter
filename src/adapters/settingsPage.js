'use strict';
const { renderPageShell, renderSettingsPage, renderNoSave } = require('../presentation/settingsPageHtml');

const PAGE_ID = 'gimmickFilterPage';

const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
  + '<path fill="currentColor" d="M32 64h448l-176 208v176l-96-48V272z"/></svg>';

// Script de la page : charge le HTML rendu par le plugin et délègue les actions.
// Une réponse arrivée après l'arrêt (window.GimmickFilterPage retiré ou remplacé) n'écrit rien dans le DOM.
const PAGE_SCRIPT = `(function () { try {
  var PLUGIN = 'gimmick-filter';
  function locale() {
    try { return (typeof I18n !== 'undefined' && I18n && I18n.locale) ? String(I18n.locale) : null; } catch (e) { return null; }
  }
  var page = null;
  function live() { return window.GimmickFilterPage === page; }
  function render(root, html) {
    if (!live()) return;
    var search = root.querySelector('.gf-page-search');
    var query = search ? search.value : '';
    root.innerHTML = html;
    var next = root.querySelector('.gf-page-search');
    if (next && query) { next.value = query; filter(root, query); }
  }
  function filter(root, query) {
    if (!live()) return;
    var q = String(query || '').trim().toLowerCase();
    root.querySelectorAll('tr[data-gf-search]').forEach(function (tr) {
      tr.classList.toggle('gf-filtered', q !== '' && tr.getAttribute('data-gf-search').indexOf(q) < 0);
    });
  }
  function send(root, action) {
    if (!live()) return;
    plugins.invoke(PLUGIN, 'page-action', action, locale()).then(function (html) { render(root, html); })
      .catch(function (e) { console.error('[gimmick-filter] page', e); });
  }
  page = {
    init: function () {
      var root = document.getElementById('gf-page-root');
      if (!root || !live()) return;
      root.innerHTML = '<div class="loading"></div>';
      plugins.invoke(PLUGIN, 'page-load', locale()).then(function (html) { render(root, html); })
        .catch(function (e) { console.error('[gimmick-filter] page', e); });
      root.onchange = function (ev) {
        var t = ev.target;
        if (!t || t.type !== 'checkbox' || !t.hasAttribute('data-gf-action')) return;
        send(root, { type: t.getAttribute('data-gf-action'), arg: { name: t.getAttribute('data-gf-name'), on: t.checked } });
      };
      root.oninput = function (ev) {
        if (ev.target && ev.target.classList.contains('gf-page-search')) filter(root, ev.target.value);
      };
      root.onclick = function (ev) {
        var t = ev.target && ev.target.closest ? ev.target.closest('button[data-gf-action]') : null;
        if (!t) return;
        var type = t.getAttribute('data-gf-action');
        var from = t.getAttribute('data-gf-from');
        if (type === 'renamePreset') {
          var input = t.parentNode.querySelector('.gf-rename-input');
          send(root, { type: type, arg: { from: from, to: input ? input.value : '' } });
        } else if (type === 'deletePreset') {
          send(root, { type: type, arg: from });
        } else {
          send(root, { type: type });
        }
      };
    }
  };
  window.GimmickFilterPage = page;
} catch (e) { console.error('[gimmick-filter] page réglages', e); } })();`;

const STOP_SCRIPT = "(function () { try { delete window.GimmickFilterPage; } catch (e) {} })();";

function createSettingsPage({ ui, ipc, controller, logger }) {
  function html(fn, locale, name) {
    try {
      const data = fn();
      return data ? renderSettingsPage(data, locale) : renderNoSave(locale);
    } catch (e) {
      logger.error(`settingsPage.${name}`, e);
      return renderNoSave(locale);
    }
  }

  function run(script, name) {
    Promise.resolve(ui.executeJS(script)).catch((e) => logger.error(`settingsPage.${name}`, e));
  }

  function start() {
    ipc.handle('page-load', (event, locale) => html(() => controller.load(), locale, 'load'));
    ipc.handle('page-action', (event, action, locale) => html(() => controller.act(action), locale, 'act'));
    ui.addPage({
      id: PAGE_ID,
      title: 'Gimmick Filter',
      backButton: 'mainOfficePage',
      initFunction: 'GimmickFilterPage',
      html: renderPageShell(),
    });
    ui.addSideMenuItem({ pageId: PAGE_ID, label: 'Gimmick Filter', section: 'bottom', svgIcon: ICON });
    run(PAGE_SCRIPT, 'start');
  }

  return {
    start,
    stop: () => run(STOP_SCRIPT, 'stop'),
    reinject: () => run(PAGE_SCRIPT, 'reinject'),
  };
}

module.exports = {
  createSettingsPage, PAGE_ID, PAGE_SCRIPT, STOP_SCRIPT,
};
