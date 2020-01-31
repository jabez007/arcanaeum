// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    let plaintext = '';
    let i = 0;
    while (i < cipherText.length) {
      if ((key.cipherChars || '').indexOf(String(cipherText.charAt(i))) !== -1) {
        const row = (key.cipherChars || '').indexOf(String(cipherText.charAt(i)));
        i += 1;
        const column = (key.cipherChars || '').indexOf(String(cipherText.charAt(i)));
        plaintext += key.square[row][column];
      } else {
        plaintext += cipherText.charAt(i);
      }
      i += 1;
    }
    return plaintext;
  };
}
