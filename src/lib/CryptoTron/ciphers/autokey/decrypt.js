// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '').toLowerCase().replace(/[^a-z]/g, '');
    let autokey = key.primer.toLowerCase().replace(/[^a-z]/g, '');
    let plaintext = '';
    for (let i = 0; i < ciphertext.length; i += 1) {
      const plainchar = String.fromCharCode(
        ((ciphertext.charCodeAt(i) - 97 + 26 - (autokey.charCodeAt(i) - 97)) % 26)
        + 97,
      );
      plaintext += plainchar;
      autokey += plainchar;
    }
    return plaintext;
  };
}
