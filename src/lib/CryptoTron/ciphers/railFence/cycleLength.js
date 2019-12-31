// eslint-disable-next-line import/prefer-default-export
export function cycleLength(rails) {
  return Math.max(0, 2 * rails - 2); // 0 is our min cycle length
}
