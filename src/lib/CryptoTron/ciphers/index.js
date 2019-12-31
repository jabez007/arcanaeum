
export const alphaLower = 'abcdefghijklmnopqrstuvwxyz';

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
