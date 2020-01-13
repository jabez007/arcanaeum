
export const alphaLower = [...Array(26)]
  .map((v, i) => String.fromCharCode(97 + i))
  .join('');

export const re = /[a-z]/;

export const alphaUpper = [...Array(26)]
  .map((v, i) => String.fromCharCode(65 + i))
  .join('');

export function modulo(n, m) {
  return ((n % m) + m) % m;
}

export function getUniqueCharacters(input) {
  const str = input || '';
  let unique = '';
  for (let i = 0; i < str.length; i += 1) {
    if (!unique.includes(str[i])) {
      unique += str[i];
    }
  }
  return unique;
}
