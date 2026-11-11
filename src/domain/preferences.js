'use strict';
const { cleanStringList } = require('./text');

function cleanName(name) {
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

function setPinned(state, name, on) {
  const n = cleanName(name);
  if (!n) return state;
  return {
    ...state,
    pinned: on ? cleanStringList([...state.pinned, n]) : state.pinned.filter((x) => x !== n),
    hidden: on ? state.hidden.filter((x) => x !== n) : state.hidden,
  };
}

function setHidden(state, name, on) {
  const n = cleanName(name);
  if (!n) return state;
  return {
    ...state,
    hidden: on ? cleanStringList([...state.hidden, n]) : state.hidden.filter((x) => x !== n),
    pinned: on ? state.pinned.filter((x) => x !== n) : state.pinned,
  };
}

function togglePinned(state, name) {
  const n = cleanName(name);
  if (!n) return state;
  return setPinned(state, n, !state.pinned.includes(n));
}

function unpinAll(state) {
  return { ...state, pinned: [] };
}

function unhideAll(state) {
  return { ...state, hidden: [] };
}

module.exports = { setPinned, setHidden, togglePinned, unpinAll, unhideAll };
