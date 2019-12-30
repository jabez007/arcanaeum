import { encoding } from './encoding';

export function encrypt(plainText) {
  const plaintext = (plainText || '').toUpperCase();
  let ciphertext = '';
  for (let i = 0; i < plaintext.length; i += 1) {
    const char = plaintext[i];
    if (encoding[char]) {
      ciphertext += encoding[char];
    } else {
      ciphertext += char;
    }
  }
  return ciphertext.replace(/[^ab]/g, '');
}

export function enstegano(encodedString, message) {
  const re = /[a-zA-Z]/;
  let steganograph = '';
  let i = 0;
  for (let j = 0; j < message.length; j += 1) {
    const char = message[j];
    if (re.test(char)) {
      if (encodedString[i] === 'a') {
        steganograph += char.toLowerCase();
        i += 1;
      } else if (encodedString[i] === 'b') {
        steganograph += char.toUpperCase();
        i += 1;
      }
    } else {
      steganograph += char;
    }
  }
  return steganograph;
}
