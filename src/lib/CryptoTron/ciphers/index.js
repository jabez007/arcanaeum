
export const alphaLower = [...Array(26)]
  .map((v, i) => String.fromCharCode(97 + i))
  .join('');

export const alphaUpper = [...Array(26)]
  .map((v, i) => String.fromCharCode(65 + i))
  .join('');

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
