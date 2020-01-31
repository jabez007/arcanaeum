// eslint-disable-next-line import/prefer-default-export
export function decrypt(key) {
  return (cipherText) => {
    const ciphertext = (cipherText || '');
    const keywordArray = (key.keyword || '').split('');
    const sortedKeyword = [...keywordArray];
    sortedKeyword.sort(); // sorts the elements of array IN PLACE
    const plaintext = new Array(ciphertext.length);
    let k = 0;
    for (let i = 0; i < sortedKeyword.length; i += 1) {
      const index = keywordArray.indexOf(sortedKeyword[i]);
      // remove used letters as we go in case of duplicates
      keywordArray.splice(index, 1, '');
      for (let j = index; j < ciphertext.length; j += key.keyword.length) {
        plaintext[j] = ciphertext[k];
        k += 1;
      }
    }
    return plaintext.join('');
  };
}
