import { re, modulo } from '../index';

export function findInverse(a) {
  for (let i = 1; i < 26; i += 1) {
    if ((a * i) % 26 === 1) {
      return i;
    }
  }
  return NaN;
}

export function decrypt(key) {
  return (cipherText) => {
    const inverse = findInverse(key.alpha);
    const ciphertext = (cipherText || '').toLowerCase();
    let plaintext = '';
    for (let i = 0; i < ciphertext.length; i += 1) {
      if (re.test(ciphertext.charAt(i))) {
        plaintext += String.fromCharCode(
          modulo(inverse * (ciphertext.charCodeAt(i) - 97) - key.beta, 26) + 97,
        );
      } else {
        plaintext += ciphertext.charAt(i);
      }
    }
    return plaintext;
  };
}
