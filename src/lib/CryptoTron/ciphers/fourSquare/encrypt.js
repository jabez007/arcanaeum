// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase();
    if (plaintext.replace(/[^a-z]/g, '').length % 2 === 0) {
      let ciphertext = '';
      let i = 0;
      while (i < plaintext.length) {
        const plainpair = [];
        while (plainpair.filter(c => /[a-z]/.test(c)).length < 2) {
          plainpair.push(plaintext[i]);
          i += 1;
        }

        const firstplaincharIndex = plainpair.findIndex(c => /[a-z]/.test(c));
        const row1 = key.plainSquare.findIndex(r => r.includes(plainpair[firstplaincharIndex]));
        const col1 = key.plainSquare[row1].indexOf(plainpair[firstplaincharIndex]);

        const secondplaincharIndex = plainpair.findIndex((c, ix) => ix > firstplaincharIndex && /[a-z]/.test(c));
        const row2 = key.plainSquare.findIndex(r => r.includes(plainpair[secondplaincharIndex]));
        const col2 = key.plainSquare[row2].indexOf(plainpair[secondplaincharIndex]);

        plainpair.splice(firstplaincharIndex, 1, key.upperCipherSquare[row1][col2]);
        plainpair.splice(secondplaincharIndex, 1, key.lowerCipherSquare[row2][col1]);
        ciphertext += plainpair.join('');
      }
      return ciphertext;
    }
    return '';
  };
}
