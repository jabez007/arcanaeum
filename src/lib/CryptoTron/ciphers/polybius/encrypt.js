import { re } from '../index';

// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase().replace(/[j]/g, 'i');
    let ciphertext = '';
    for (let i = 0; i < plaintext.length; i += 1) {
      const char = plaintext[i];
      if (re.test(char)) {
        const row = key.square.findIndex(r => r.includes(char));
        const column = key.square[row].findIndex(c => c === char);
        ciphertext += (key.cipherChars || '').charAt(row) + (key.cipherChars || '').charAt(column);
      } else {
        ciphertext += char;
      }
    }
    return ciphertext;
  };
}
