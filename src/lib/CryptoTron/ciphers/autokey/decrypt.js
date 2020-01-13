import { re, modulo } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '').toLowerCase();
    let autokey = key.primer.toLowerCase().replace(/[^a-z]/g, '');
    let plaintext = '';
    let j = 0;
    for (let i = 0; i < ciphertext.length; i += 1) {
      if (re.test(ciphertext.charAt(i))) {
        const plainchar = String.fromCharCode(
          modulo((ciphertext.charCodeAt(i) - 97) - (autokey.charCodeAt(j) - 97), 26) + 97,
        );
        plaintext += plainchar;
        autokey += plainchar;
        j += 1;
      } else {
        plaintext += ciphertext.charAt(i);
      }
    }
    return plaintext;
  };
}
