// eslint-disable-next-line import/prefer-default-export
export function decrypt(cipherText, cipherAlphabet, plainAlphabet) {
  const ciphertext = (cipherText || '').toLowerCase();
  let plaintext = '';
  const re = /[a-z]/;
  for (let i = 0; i < ciphertext.length; i += 1) {
    const char = ciphertext[i];
    if (re.test(char)) {
      const pos = cipherAlphabet.indexOf(char);
      plaintext += plainAlphabet[pos];
    } else {
      plaintext += char;
    }
  }
  return plaintext;
}
