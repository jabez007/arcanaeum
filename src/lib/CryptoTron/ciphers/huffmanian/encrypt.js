import { encoding } from './encoding';
import * as steganography from '../steganography';

export function encode(plainText) {
  return steganography.encode(plainText, encoding).replace(/[^01]/g, '');
}

export function enstegano(encodedString, message) {
  return steganography.enstegano(message, encodedString, encoding);
}
