function number(min, max) {
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  return Math.random() * (actualMax - actualMin) + actualMin;
}

function int(min, max) {
  const minCeil = Math.ceil(Math.min(min, max));
  const maxFloor = Math.floor(Math.max(min, max));
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxFloor - minCeil)) + minCeil;
}

function intInclusive(min, max) {
  const minCeil = Math.ceil(Math.min(min, max));
  const maxFloor = Math.floor(Math.max(min, max));
  // The maximum is inclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

export default {
  number,
  int,
  intInclusive,
};
