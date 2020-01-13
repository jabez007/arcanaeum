import { re, modulo } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase();
    let ciphertext = '';
    for (let i = 0; i < plaintext.length; i += 1) {
      if (re.test(plaintext.charAt(i))) {
        ciphertext += String.fromCharCode(
          modulo((plaintext.charCodeAt(i) - 97) + key.shift, 26) + 97,
        );
      } else {
        ciphertext += plaintext.charAt(i);
      }
    }
    return ciphertext;
  };
}
