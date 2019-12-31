export * from './encrypt';
export * from './decrypt';

export function gcd(a, b) {
  if (!b) {
    return a;
  }
  return gcd(b, a % b);
}
