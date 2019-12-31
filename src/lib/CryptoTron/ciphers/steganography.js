import { getUniqueCharacters } from './index';

export function encode(plainText, encoding) {
  const plaintext = (plainText || '').toUpperCase();
  let ciphertext = '';
  for (let i = 0; i < plaintext.length; i += 1) {
    const char = plaintext[i];
    if (encoding[char]) {
      ciphertext += encoding[char];
    } else {
      ciphertext += char;
    }
  }
  return ciphertext;
}

export function enstegano(message, encodedString, encoding) {
  const re = /[a-zA-Z]/;
  let steganograph = '';
  let i = 0;
  for (let j = 0; j < message.length; j += 1) {
    const char = message[j];
    if (re.test(char)) {
      if (encodedString[i] === encoding.lowerChar) {
        steganograph += char.toLowerCase();
        i += 1;
      } else if (encodedString[i] === encoding.upperChar) {
        steganograph += char.toUpperCase();
        i += 1;
      }
    } else {
      steganograph += char;
    }
  }
  return steganograph;
}

function findEncoding(block) {
  return e => (e || {}).encoding === (block || '');
}

export function decrypt(cipherText, encoding) {
  const unique = getUniqueCharacters(
    (cipherText || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
  );
  if (unique.length === 2) {
    // we have just the encoding
    const ciphertext = cipherText.toLowerCase();
    const encodingArray = Object.keys(encoding)
      .filter(key => key.length === 1)
      .map(char => ({
        char,
        encoding: encoding[char],
      }));
    let block = '';
    let plainText = '';
    for (let i = 0; i < ciphertext.length; i += 1) {
      const char = ciphertext[i];
      if (char === encoding.lowerChar || char === encoding.upperChar) {
        block += char;
        const enc = encodingArray.find(findEncoding(block));
        if (enc) {
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
        encodedString += encoding.lowerChar;
      } else if (upperCase.test(char)) {
        encodedString += encoding.upperChar;
      }
    }
    return decrypt(encodedString, encoding);
  }
  return '';
}
