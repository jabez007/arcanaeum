// eslint-disable-next-line import/prefer-default-export
export function encrypt(plainText, shift) {
  const plaintext = (plainText || '').toLowerCase();
  let ciphertext = '';
  const re = /[a-z]/;
  for (let i = 0; i < plaintext.length; i += 1) {
    if (re.test(plaintext.charAt(i))) {
      ciphertext += String.fromCharCode(
        ((plaintext.charCodeAt(i) - 97 + shift) % 26) + 97,
      );
    } else {
      ciphertext += plaintext.charAt(i);
    }
  }
  return ciphertext;
}