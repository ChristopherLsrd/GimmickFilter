'use strict';
const { renderPanel, renderToast, cardLabels } = require('../presentation/panelHtml');

// Script exécuté dans la fenêtre du jeu. Il reste « bête » : il observe les deux modales,
// envoie l'état des cartes au plugin et applique le modèle de vue reçu.
// Le jeu lie la sélection d'une carte à chaque <li> : nos clics sont interceptés en capture,
// et le séparateur est un <div> pour ne jamais devenir une carte sélectionnable.
const WATCH_SCRIPT = `(function () { try {
  var PLUGIN = 'gimmick-filter';
  if (window.__gimmickFilter && window.__gimmickFilter.stop) window.__gimmickFilter.stop();
  var CONTEXTS = [
    { id: 'change', modal: '#changeGimmickModal', list: '#changeGimmickModal .gimmickSelect', anchor: '#changeGimmickModal .gimmickSelect' },
    { id: 'contract', modal: '#negotiationModal', list: '#negotiationModal .negotiateGimmickContainer .gimmickSelect', anchor: '#negotiationModal .negotiateGimmickContainer' }
  ];
  var lastSignature = {};
  var pending = null;
  var toastTimer = null;
  var warned = false;
  var stopped = false;
  var inactive = {};
  var inflight = {};

  function locale() {
    try { return (typeof I18n !== 'undefined' && I18n && I18n.locale) ? String(I18n.locale) : null; } catch (e) { return null; }
  }
  function visible(el) {
    return !!el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none';
  }
  function cards(ul) {
    return Array.prototype.filter.call(ul.children, function (li) {
      return li.tagName === 'LI' && li.hasAttribute('data-gimmick-type');
    });
  }
  function cardName(li) { return li.getAttribute('data-gimmick-type') || ''; }
  function snapshot(ul) {
    var unmet = [], known = false, selected = null, list = cards(ul);
    list.forEach(function (li) {
      var name = cardName(li);
      if (li.querySelector('.req-met, .req-unmet')) known = true;
      if (name && li.querySelector('.req-unmet')) unmet.push(name);
      if (li.classList.contains('selected')) selected = name;
    });
    return { requirements: { known: known, unmet: unmet }, selected: selected, count: list.length };
  }
  function signature(s) { return JSON.stringify([s.requirements, s.selected, s.count, locale()]); }
  function ensureIndex(ul) {
    cards(ul).forEach(function (li, i) { if (!li.hasAttribute('data-gf-index')) li.setAttribute('data-gf-index', String(i)); });
  }
  function payload(ctx, s, action) {
    var p = { context: ctx.id, requirements: s.requirements, selected: s.selected, locale: locale() };
    if (action) p.action = action;
    return p;
  }
  function decorate(li, name, labels, pinned, forced) {
    var box = li.querySelector(':scope > .gf-card-actions');
    if (!box) {
      box = document.createElement('span');
      box.className = 'gf-card-actions';
      box.setAttribute('data-plugin-id', PLUGIN);
      var pin = document.createElement('button');
      pin.type = 'button'; pin.className = 'gf-pin';
      pin.setAttribute('data-gf-action', 'togglePin'); pin.setAttribute('data-gf-arg', name);
      var hide = document.createElement('button');
      hide.type = 'button'; hide.className = 'gf-hide'; hide.textContent = '\\u2298';
      hide.setAttribute('data-gf-action', 'hide'); hide.setAttribute('data-gf-arg', name);
      box.appendChild(pin); box.appendChild(hide);
      li.insertBefore(box, li.firstChild);
    }
    var p = box.querySelector('.gf-pin');
    p.textContent = pinned ? '\\u2605' : '\\u2606';
    p.title = pinned ? labels.unpin : labels.pin;
    p.classList.toggle('gf-on', pinned);
    box.querySelector('.gf-hide').title = labels.hide;
    li.classList.toggle('gf-forced', forced);
    if (forced) li.setAttribute('data-gf-forced', labels.forced); else li.removeAttribute('data-gf-forced');
  }
  function showToast(panel, html) {
    var modal = panel.parentNode;
    var old = modal.querySelector('.gf-toast');
    if (old) old.remove();
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    if (!html) return;
    panel.insertAdjacentHTML('afterend', html);
    toastTimer = setTimeout(function () {
      var t = document.querySelector('.gf-toast');
      if (t) t.remove();
      toastTimer = null;
    }, 5000);
  }
  function apply(ctx, ul, vm) {
    if (!vm) { restore(ctx); return; }
    var modal = document.querySelector(ctx.modal);
    var anchor = document.querySelector(ctx.anchor);
    if (!modal || !anchor) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = vm.panelHtml;
    var panel = wrap.firstElementChild;
    var old = modal.querySelector('.gf-panel');
    var oldInput = old ? old.querySelector('.gf-preset-name') : null;
    var kept = null;
    if (oldInput) kept = { value: oldInput.value, start: oldInput.selectionStart, end: oldInput.selectionEnd, focused: document.activeElement === oldInput };
    if (old) old.replaceWith(panel); else anchor.parentNode.insertBefore(panel, anchor);
    var input = panel.querySelector('.gf-preset-name');
    if (input) {
      if (kept) {
        input.value = kept.value;
        try { input.setSelectionRange(kept.start, kept.end); } catch (e) {}
        if (kept.focused) input.focus();
      } else { input.focus(); input.select(); }
    }

    var byName = {};
    cards(ul).forEach(function (li) { byName[cardName(li)] = li; });
    var placed = {};
    ul.querySelectorAll(':scope > .gf-separator').forEach(function (el) { el.remove(); });
    if (byName['']) { ul.appendChild(byName['']); placed[''] = true; }
    vm.list.order.forEach(function (name) {
      var li = byName[name];
      if (!li) return;
      li.classList.remove('gf-hidden');
      ul.appendChild(li);
      placed[name] = true;
      if (name === vm.list.separatorAfter) {
        var sep = document.createElement('div');
        sep.className = 'gf-separator';
        sep.setAttribute('role', 'separator');
        sep.setAttribute('data-plugin-id', PLUGIN);
        ul.appendChild(sep);
      }
    });
    cards(ul).forEach(function (li) {
      var name = cardName(li);
      if (placed[name]) return;
      if (vm.list.hidden.indexOf(name) >= 0) li.classList.add('gf-hidden'); else li.classList.remove('gf-hidden');
      ul.appendChild(li);
    });
    cards(ul).forEach(function (li) {
      var name = cardName(li);
      if (!name) return;
      decorate(li, name, vm.labels, vm.list.pinned.indexOf(name) >= 0, vm.list.forced.indexOf(name) >= 0);
    });
    showToast(panel, vm.toastHtml);
  }
  function restore(ctx) {
    var modal = document.querySelector(ctx.modal);
    var ul = document.querySelector(ctx.list);
    if (modal) modal.querySelectorAll('.gf-panel, .gf-toast').forEach(function (el) { el.remove(); });
    if (!ul) return;
    ul.querySelectorAll('.gf-separator, .gf-card-actions').forEach(function (el) { el.remove(); });
    var list = cards(ul);
    list.forEach(function (li) {
      if (li.classList.contains('gf-hidden')) li.classList.remove('gf-hidden');
      if (li.classList.contains('gf-forced')) li.classList.remove('gf-forced');
      if (li.hasAttribute('data-gf-forced')) li.removeAttribute('data-gf-forced');
    });
    var indexed = list.filter(function (li) { return li.hasAttribute('data-gf-index'); });
    var sorted = indexed.slice().sort(function (a, b) { return Number(a.getAttribute('data-gf-index')) - Number(b.getAttribute('data-gf-index')); });
    var inOrder = indexed.every(function (li, i) { return li === sorted[i]; });
    if (!inOrder) sorted.forEach(function (li) { ul.appendChild(li); });
    indexed.forEach(function (li) { li.removeAttribute('data-gf-index'); });
  }
  function request(ctx, ul, channel, action) {
    var sent = snapshot(ul);
    var isOpen = channel === 'list-open';
    if (isOpen) inflight[ctx.id] = true;
    function done(isInactive) {
      if (isOpen) inflight[ctx.id] = false;
      inactive[ctx.id] = isInactive;
      lastSignature[ctx.id] = signature(sent);
      schedule();
    }
    plugins.invoke(PLUGIN, channel, payload(ctx, sent, action)).then(function (vm) {
      if (stopped) return;
      try {
        apply(ctx, ul, vm);
        done(!vm);
      } catch (e) { console.error('[gimmick-filter] application', e); done(true); }
    }).catch(function (e) {
      if (stopped) return;
      console.error('[gimmick-filter] ' + channel, e);
      done(true);
    });
  }
  function check() {
    try {
      var found = false;
      CONTEXTS.forEach(function (ctx) {
        var modal = document.querySelector(ctx.modal);
        var ul = document.querySelector(ctx.list);
        if (!modal || !ul) return;
        found = true;
        if (!visible(modal)) { lastSignature[ctx.id] = null; inactive[ctx.id] = false; return; }
        if (inflight[ctx.id]) return;
        ensureIndex(ul);
        var sig = signature(snapshot(ul));
        if (sig === lastSignature[ctx.id] && (modal.querySelector('.gf-panel') || inactive[ctx.id])) return;
        lastSignature[ctx.id] = sig;
        request(ctx, ul, 'list-open');
      });
      if (!found && !warned) {
        warned = true;
        plugins.send(PLUGIN, 'warn', 'listes de gimmicks introuvables dans la page');
      }
    } catch (e) { console.error('[gimmick-filter] surveillance', e); }
  }
  function schedule() {
    if (pending) return;
    pending = setTimeout(function () { pending = null; check(); }, 50);
  }
  function contextOf(el) {
    for (var i = 0; i < CONTEXTS.length; i++) { if (el.closest(CONTEXTS[i].modal)) return CONTEXTS[i]; }
    return null;
  }
  function onClick(ev) {
    try {
      var target = ev.target && ev.target.closest ? ev.target.closest('[data-gf-action]') : null;
      if (!target) return;
      var ctx = contextOf(target);
      if (!ctx) return;
      ev.stopPropagation();
      ev.preventDefault();
      if (target.disabled) return;
      var arg = target.getAttribute('data-gf-arg');
      var inputSelector = target.getAttribute('data-gf-input');
      if (inputSelector) {
        var input = target.closest('.gf-panel').querySelector(inputSelector);
        arg = input ? input.value : '';
      }
      var ul = document.querySelector(ctx.list);
      if (ul) request(ctx, ul, 'list-action', { type: target.getAttribute('data-gf-action'), arg: arg });
    } catch (e) { console.error('[gimmick-filter] clic', e); }
  }
  function onChange(ev) {
    try {
      var target = ev.target;
      if (!target || !target.matches || !target.matches('select[data-gf-change]')) return;
      var ctx = contextOf(target);
      var ul = ctx ? document.querySelector(ctx.list) : null;
      if (ul) request(ctx, ul, 'list-action', { type: target.getAttribute('data-gf-change'), arg: target.value });
    } catch (e) { console.error('[gimmick-filter] changement', e); }
  }
  function onKeyDown(ev) {
    try {
      if (ev.key !== 'Enter' || !ev.target || !ev.target.classList || !ev.target.classList.contains('gf-preset-name')) return;
      ev.preventDefault();
      ev.stopPropagation();
      var confirm = ev.target.closest('.gf-panel').querySelector('[data-gf-action="savePreset"]');
      if (confirm) confirm.click();
    } catch (e) { console.error('[gimmick-filter] clavier', e); }
  }
  var observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  document.addEventListener('click', onClick, true);
  document.addEventListener('change', onChange, true);
  document.addEventListener('keydown', onKeyDown, true);
  function stop() {
    stopped = true;
    observer.disconnect();
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('change', onChange, true);
    document.removeEventListener('keydown', onKeyDown, true);
    if (pending) clearTimeout(pending);
    if (toastTimer) clearTimeout(toastTimer);
    CONTEXTS.forEach(restore);
    delete window.__gimmickFilter;
  }
  window.__gimmickFilter = { stop: stop, check: check };
  check();
} catch (e) { console.error('[gimmick-filter] démarrage', e); } })();`;

const STOP_SCRIPT = "(function () { try { if (window.__gimmickFilter) window.__gimmickFilter.stop(); } catch (e) { console.error('[gimmick-filter] arrêt', e); } })();";

function toViewModel(result, locale) {
  if (!result) return null;
  return {
    panelHtml: renderPanel({ ...result.panel, locale }),
    list: result.list,
    toastHtml: result.toast ? renderToast(result.toast, locale) : null,
    labels: cardLabels(locale),
  };
}

function createGimmickListWatcher({ ui, ipc, controller, logger, css }) {
  function handle(fn, name) {
    return (event, payload) => {
      const p = payload || {};
      try {
        return toViewModel(fn(p), p.locale);
      } catch (e) {
        logger.error(`gimmickListWatcher.${name}`, e);
        return null;
      }
    };
  }

  function run(script, name) {
    Promise.resolve(ui.executeJS(script)).catch((e) => logger.error(`gimmickListWatcher.${name}`, e));
  }

  function start() {
    ui.injectCSS(css);
    ipc.handle('list-open', handle((p) => controller.open(p), 'open'));
    ipc.handle('list-action', handle((p) => controller.act(p), 'act'));
    ipc.on('warn', (event, message) => logger.error('gimmickListWatcher', message));
    run(WATCH_SCRIPT, 'start');
  }

  return {
    start,
    stop: () => run(STOP_SCRIPT, 'stop'),
    reinject: () => run(WATCH_SCRIPT, 'reinject'),
  };
}

module.exports = {
  createGimmickListWatcher, toViewModel, WATCH_SCRIPT, STOP_SCRIPT,
};
