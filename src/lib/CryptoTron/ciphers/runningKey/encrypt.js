import { re, modulo } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase();
    const keytext = key.keyText.toLowerCase().replace(
      /[^a-z]/g,
      '',
    );
    let ciphertext = '';
    if (keytext.length >= plaintext.replace(/[^a-z]/g, '').length) {
      let j = 0;
      for (let i = 0; i < plaintext.length; i += 1) {
        if (re.test(plaintext.charAt(i))) {
          ciphertext += String.fromCharCode(
            modulo((plaintext.charCodeAt(i) - 97) + (keytext.charCodeAt(j) - 97), 26) + 97,
          );
          j += 1;
        } else {
          ciphertext += plaintext.charAt(i);
        }
      }
    }
    return ciphertext;
  };
}
