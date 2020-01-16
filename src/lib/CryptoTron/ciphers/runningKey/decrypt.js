import { re, modulo } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '').toLowerCase();
    const keytext = key.keyText.toLowerCase().replace(
      /[^a-z]/g,
      '',
    );
    let plaintext = '';
    if (keytext.length >= ciphertext.replace(/[^a-z]/g, '').length) {
      let j = 0;
      for (let i = 0; i < ciphertext.length; i += 1) {
        if (re.test(ciphertext.charAt(i))) {
          plaintext += String.fromCharCode(
            modulo((ciphertext.charCodeAt(i) - 97) - (keytext.charCodeAt(j) - 97), 26) + 97,
          );
          j += 1;
        } else {
          plaintext += ciphertext.charAt(i);
        }
      }
    }
    return plaintext;
  };
}
