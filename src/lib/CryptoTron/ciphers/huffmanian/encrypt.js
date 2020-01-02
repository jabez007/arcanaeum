import { encoding } from './encoding';
import * as steganography from '../steganography';

export function encode(plainText) {
  return steganography.encode(plainText, encoding).replace(/[^01]/g, '');
}

export function enstegano(key) {
  return encodedString => steganography.enstegano(key.falseMessage, encodedString, encoding);
}

export function encrypt(key) {
  return plainText => enstegano(key)(encode(plainText));
}
