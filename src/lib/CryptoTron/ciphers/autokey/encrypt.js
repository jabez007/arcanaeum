// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase().replace(/[^a-z]/g, '');
    const autokey = (key.primer.toLowerCase() + plaintext).replace(
      /[^a-z]/g,
      '',
    );
    let ciphertext = '';
    for (let i = 0; i < plaintext.length; i += 1) {
      ciphertext += String.fromCharCode(
        ((plaintext.charCodeAt(i) - 97 + (autokey.charCodeAt(i) - 97)) % 26) + 97,
      );
    }
    return ciphertext;
  };
}
