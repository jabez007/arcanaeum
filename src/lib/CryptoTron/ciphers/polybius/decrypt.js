// eslint-disable-next-line import/prefer-default-export
export function decrypt(cipherText, square, chars) {
  let plaintext = '';
  let i = 0;
  while (i < cipherText.length) {
    if (chars.indexOf(String(cipherText.charAt(i))) !== -1) {
      const row = chars.indexOf(String(cipherText.charAt(i)));
      i += 1;
      const column = chars.indexOf(String(cipherText.charAt(i)));
      plaintext += square[row][column];
    } else {
      plaintext += cipherText.charAt(i);
    }
    i += 1;
  }
  return plaintext;
}
