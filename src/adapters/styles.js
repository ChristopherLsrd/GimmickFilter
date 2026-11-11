'use strict';

// Styles injectés dans le jeu. Toujours les variables du thème (guide UI de PWS).
const CSS = `
.gf-panel { position: sticky; top: 0; z-index: 3; background: var(--modal-background, var(--background-1)); border: var(--panel-border); border-radius: var(--panel-radius); padding: 8px 10px; margin: 0 0 8px; display: flex; flex-direction: column; gap: 6px; color: var(--modal-text, var(--color-0)); }
.gf-panel:not(.gf-open) .gf-body { display: none; }
.gf-body { display: flex; flex-direction: column; gap: 6px; max-height: 45vh; overflow-y: auto; }
.gf-toggle::after { content: ' \\25BE'; }
.gf-panel.gf-open .gf-toggle::after { content: ' \\25B4'; }
.gf-bar .gf-count { margin-left: auto; }
.gf-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.gf-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-2); min-width: 110px; }
.gf-btn { margin: 0; width: auto; }
.gf-select { margin: 0; min-width: 160px; }
.gf-preset-name { margin: 0; min-width: 200px; }
.gf-seg { display: inline-flex; border: var(--panel-border); border-radius: var(--button-radius); overflow: hidden; margin-right: 12px; }
.gf-seg-btn { border: 0; border-radius: 0; margin: 0; padding: 3px 9px; background: transparent; color: inherit; cursor: pointer; }
.gf-seg-btn.gf-on { background: var(--button); color: var(--button-text); }
.gf-chip { border: var(--panel-border); border-radius: 999px; padding: 2px 9px; margin: 0; background: transparent; color: inherit; cursor: pointer; font-size: 11px; }
.gf-chip.gf-inc { background: color-mix(in srgb, var(--positive-effect) 25%, transparent); border-color: var(--positive-effect); }
.gf-chip.gf-exc { background: color-mix(in srgb, var(--negative-effect) 25%, transparent); border-color: var(--negative-effect); text-decoration: line-through; }
.gf-chip:disabled { opacity: .35; cursor: default; }
.gf-count { font-size: 11px; color: var(--color-2); }
.gf-empty { padding: 8px; text-align: center; color: var(--color-2); }
.gf-error { color: var(--alert); }
.gf-muted { color: var(--color-2); }
.gimmickSelect, .gimmickSelect > *, .gf-panel { overflow-anchor: none; }
.gimmickSelect > li { position: relative; }
.gimmickSelect > li.gf-hidden { display: none !important; }
.gimmickSelect > li.gf-forced { outline: 1px dashed var(--color-2); }
.gimmickSelect > li.gf-forced::after { content: attr(data-gf-forced); display: block; font-size: 10px; color: var(--color-2); }
.gf-card-actions { position: absolute; top: 4px; right: 6px; display: flex; gap: 4px; z-index: 1; }
.gf-card-actions button { background: transparent; border: 0; margin: 0; padding: 0 3px; cursor: pointer; color: var(--color-2); font-size: 15px; line-height: 1; }
.gf-card-actions .gf-pin.gf-on { color: var(--button); }
.gf-separator { border-top: 2px solid var(--button); margin: 8px 0; list-style: none; }
.gf-toast { display: flex; align-items: center; gap: 8px; padding: 6px 10px; margin: 0 0 8px; background: var(--background-3); border-radius: var(--panel-radius); }
.gf-page-inner { display: flex; flex-direction: column; gap: 12px; padding: 12px; }
.gf-preset-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.gf-preset-list li { display: flex; gap: 6px; align-items: center; }
.gf-table { width: 100%; border-collapse: collapse; }
.gf-table th { background: var(--table-header); color: var(--table-header-text); text-align: left; padding: 4px 8px; }
.gf-table td { padding: 4px 8px; }
.gf-table tbody tr:nth-child(odd) { background: var(--table-row-odd); }
.gf-table tbody tr:nth-child(even) { background: var(--table-row-even); }
.gf-table tr.gf-filtered { display: none; }
`;

module.exports = { CSS };
