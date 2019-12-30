import { encoding } from './encoding';

export function getUniqueCharacters(input) {
  const str = input || '';
  let unique = '';
  for (let i = 0; i < str.length; i += 1) {
    if (i === str.lastIndexOf(str[i])) {
      unique += str[i];
    }
  }
  return unique;
}

export function findEncoding(block) {
  return e => (e || {}).encoding === (block || '');
}

export function decrypt(cipherText) {
  const unique = getUniqueCharacters(
    (cipherText || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
  );
  if (unique.length === 2) {
    // we have just the encoding
    const ciphertext = cipherText.toLowerCase();
    const encodingArray = Object.keys(encoding).map(char => ({
      char,
      encoding: encoding[char],
    }));
    let block = '';
    let plainText = '';
    for (let i = 0; i < ciphertext.length; i += 1) {
      const char = ciphertext[i];
      if (char === 'a' || char === 'b') {
        block += char;
        if (block.length === 5) {
          plainText += encodingArray.find(findEncoding(block)).char;
          block = '';
        }
      } else {
        plainText += char;
      }
    }
    return plainText;
  }
  if (unique.length > 0) {
    // or we have the steganograph
    const lowerCase = /[a-z]/;
    const upperCase = /[A-Z]/;
    let encodedString = '';
    for (let i = 0; i < cipherText.length; i += 1) {
      const char = cipherText[i];
      if (lowerCase.test(char)) {
        encodedString += 'a';
      } else if (upperCase.test(char)) {
        encodedString += 'b';
      }
    }
    return decrypt(encodedString);
  }
  return '';
}
