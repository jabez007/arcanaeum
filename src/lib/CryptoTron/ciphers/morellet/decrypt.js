import { encoding } from './encoding';
import * as steganography from '../steganography';

// eslint-disable-next-line import/prefer-default-export
export function decrypt() {
  return cipherText => steganography.decrypt(cipherText, encoding);
}
