// eslint-disable-next-line import/prefer-default-export
export function encrypt(plainText, square, chars) {
  const plaintext = (plainText || '').toLowerCase().replace(/[j]/g, 'i');
  let ciphertext = '';
  const re = /[a-z]/;
  for (let i = 0; i < plaintext.length; i += 1) {
    const char = plaintext[i];
    if (re.test(char)) {
      const row = square.findIndex(r => r.includes(char));
      const column = square[row].findIndex(c => c === char);
      ciphertext += chars.charAt(row) + chars.charAt(column);
    } else {
      ciphertext += char;
    }
  }
  return ciphertext;
}
