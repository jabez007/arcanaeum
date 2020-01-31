import { re, modulo } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '').toLowerCase();
    const keyword = (key.keyword || '').toLowerCase().replace(
      /[^a-z]/g,
      '',
    );
    let plaintext = '';
    let j = 0;
    for (let i = 0; i < ciphertext.length; i += 1) {
      if (re.test(ciphertext.charAt(i))) {
        plaintext += String.fromCharCode(
          modulo((ciphertext.charCodeAt(i) - 97) - (keyword.charCodeAt(j % keyword.length) - 97), 26) + 97,
        );
        j += 1;
      } else {
        plaintext += ciphertext.charAt(i);
      }
    }
    return plaintext;
  };
}
