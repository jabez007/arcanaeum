import { re } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase();
    let ciphertext = '';
    for (let i = 0; i < plaintext.length; i += 1) {
      const char = plaintext[i];
      if (re.test(char)) {
        const pos = key.plainAlphabet.indexOf(char);
        ciphertext += key.cipherAlphabet[pos];
      } else {
        ciphertext += char;
      }
    }
    return ciphertext;
  };
}
