
import { alphaLower, getUniqueCharacters } from '../index';

export * from './encrypt';
export * from './decrypt';

export function square(keyword) {
  const key = getUniqueCharacters(
    `${keyword || ''}${alphaLower}`,
  ).replace(/[jJ]/g, '');
  const cipherSquare = new Array(5)
    .fill(null)
    .map(() => new Array(5).fill(null));
  for (let i = 0; i < key.length; i += 1) {
    const char = key.charAt(i);
    const column = i % 5;
    const row = Math.floor(i / 5);
    cipherSquare[row][column] = char;
  }
  return cipherSquare;
}
