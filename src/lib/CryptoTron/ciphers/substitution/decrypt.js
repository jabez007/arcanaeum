import { re } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '').toLowerCase();
    let plaintext = '';
    for (let i = 0; i < ciphertext.length; i += 1) {
      const char = ciphertext[i];
      if (re.test(char)) {
        const pos = key.cipherAlphabet.indexOf(char);
        plaintext += key.plainAlphabet[pos];
      } else {
        plaintext += char;
      }
    }
    return plaintext;
  };
}
