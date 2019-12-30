// eslint-disable-next-line import/prefer-default-export
export function decrypt(cipherText, primer) {
  const ciphertext = (cipherText || '').toLowerCase().replace(/[^a-z]/g, '');
  let key = primer.toLowerCase().replace(/[^a-z]/g, '');
  let plaintext = '';
  for (let i = 0; i < ciphertext.length; i += 1) {
    const plainchar = String.fromCharCode(
      ((ciphertext.charCodeAt(i) - 97 + 26 - (key.charCodeAt(i) - 97)) % 26)
        + 97,
    );
    plaintext += plainchar;
    key += plainchar;
  }
  return plaintext;
}
