// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase().replace(/[^a-z]/g, '');
    const keywordArray = (key.keyword || '').split('');
    const sortedKeyword = [...keywordArray];
    sortedKeyword.sort(); // sorts the elements of array IN PLACE
    let ciphertext = '';
    for (let i = 0; i < sortedKeyword.length; i += 1) {
      const index = keywordArray.indexOf(sortedKeyword[i]);
      // remove used letters as we go in case of duplicates
      keywordArray.splice(index, 1, '');
      for (let j = index; j < plaintext.length; j += key.keyword.length) {
        ciphertext += plaintext.charAt(j);
      }
    }
    return ciphertext;
  };
}
