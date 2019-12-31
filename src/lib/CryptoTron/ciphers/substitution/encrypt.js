// eslint-disable-next-line import/prefer-default-export
export function encrypt(plainText, plainAlphabet, cipherAlphabet) {
  const plaintext = (plainText || '').toLowerCase();
  let ciphertext = '';
  const re = /[a-z]/;
  for (let i = 0; i < plaintext.length; i += 1) {
    const char = plaintext[i];
    if (re.test(char)) {
      const pos = plainAlphabet.indexOf(char);
      ciphertext += cipherAlphabet[pos];
    } else {
      ciphertext += char;
    }
  }
  return ciphertext;
}
