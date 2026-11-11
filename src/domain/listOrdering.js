'use strict';
const { compareNames } = require('./text');
const { listEffects } = require('./gimmick');
const { restrictToEffects } = require('./filterCriteria');
const { passesFilter } = require('./gimmickFilter');

function buildListModel({ gimmicks, state, requirements, selected }) {
  const sorted = gimmicks.slice().sort((a, b) => compareNames(a.name, b.name));
  const names = new Set(sorted.map((g) => g.name));
  const criteria = restrictToEffects(state.current, listEffects(sorted));
  const pinnedSet = new Set(state.pinned);
  const hiddenSet = new Set(state.hidden);
  const selectedName = typeof selected === 'string' && names.has(selected) ? selected : null;

  const pinnedOrder = [];
  const otherOrder = [];
  const forced = [];
  let pinnedFiltered = 0;

  for (const gimmick of sorted) {
    const isHidden = hiddenSet.has(gimmick.name);
    const isPinned = pinnedSet.has(gimmick.name) && !isHidden;
    const passes = !isHidden && passesFilter(gimmick, criteria, requirements);
    let visible = passes;
    if (!passes && gimmick.name === selectedName) {
      visible = true;
      forced.push(gimmick.name);
    }
    if (!passes && isPinned && gimmick.name !== selectedName) pinnedFiltered += 1;
    if (visible) (isPinned ? pinnedOrder : otherOrder).push(gimmick.name);
  }

  const order = [...pinnedOrder, ...otherOrder];
  const shown = new Set(order);
  return {
    order,
    separatorAfter: pinnedOrder.length && otherOrder.length ? pinnedOrder[pinnedOrder.length - 1] : null,
    hidden: sorted.map((g) => g.name).filter((name) => !shown.has(name)),
    forced,
    pinned: state.pinned.filter((name) => names.has(name)),
    counts: {
      shown: order.length,
      pinnedFiltered,
      hiddenBySetting: state.hidden.filter((name) => names.has(name)).length,
    },
  };
}

module.exports = { buildListModel };
