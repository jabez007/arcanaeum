// eslint-disable-next-line import/prefer-default-export
export function decrypt(cipherText, shift) {
  const ciphertext = (cipherText || '').toLowerCase();
  let plaintext = '';
  const re = /[a-z]/;
  for (let i = 0; i < ciphertext.length; i += 1) {
    if (re.test(ciphertext.charAt(i))) {
      plaintext += String.fromCharCode(
        ((ciphertext.charCodeAt(i) - 97 + 26 - shift) % 26) + 97,
      );
    } else {
      plaintext += ciphertext.charAt(i);
    }
  }
  return plaintext;
}
