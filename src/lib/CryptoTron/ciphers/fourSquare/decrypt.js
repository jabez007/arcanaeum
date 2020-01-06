// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '').toLowerCase();
    if (ciphertext.replace(/[^a-z]/g, '').length % 2 === 0) {
      let plaintext = '';
      let i = 0;
      while (i < ciphertext.length) {
        const cipherpair = [];
        while (cipherpair.filter(c => /[a-z]/.test(c)).length < 2) {
          cipherpair.push(ciphertext[i]);
          i += 1;
        }

        const firstciphercharIndex = cipherpair.findIndex(c => /[a-z]/.test(c));
        const row1 = key.upperCipherSquare.findIndex(r => r.includes(cipherpair[firstciphercharIndex]));
        const col2 = key.upperCipherSquare[row1].indexOf(cipherpair[firstciphercharIndex]);

        const secondciphercharIndex = cipherpair.findIndex((c, ix) => ix > firstciphercharIndex && /[a-z]/.test(c));
        const row2 = key.lowerCipherSquare.findIndex(r => r.includes(cipherpair[secondciphercharIndex]));
        const col1 = key.lowerCipherSquare[row2].indexOf(cipherpair[secondciphercharIndex]);

        cipherpair.splice(firstciphercharIndex, 1, key.plainSquare[row1][col1]);
        cipherpair.splice(secondciphercharIndex, 1, key.plainSquare[row2][col2]);
        plaintext += cipherpair.join('');
      }
      return plaintext;
    }
    return '';
  };
}
