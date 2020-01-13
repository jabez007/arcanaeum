import { re, modulo } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '').toLowerCase();
    let plaintext = '';
    for (let i = 0; i < ciphertext.length; i += 1) {
      if (re.test(ciphertext.charAt(i))) {
        plaintext += String.fromCharCode(
          modulo((ciphertext.charCodeAt(i) - 97) - key.shift, 26) + 97,
        );
      } else {
        plaintext += ciphertext.charAt(i);
      }
    }
    return plaintext;
  };
}
