import { re, modulo } from '../index';

/*
 * encryption and decryption using the beaufort cipher uses exactly the same algorithm.
 */
function algorithm(key, inText) {
  const intext = (inText || '').toLowerCase();
  const keyword = (key.keyword || '').toLowerCase().replace(/[^a-z]/g, '');
  let outtext = '';
  let j = 0;
  for (let i = 0; i < intext.length; i += 1) {
    if (re.test(intext.charAt(i))) {
      outtext += String.fromCharCode(
        modulo((keyword.charCodeAt(j % keyword.length) - 97) - (intext.charCodeAt(i) - 97), 26) + 97,
      );
      j += 1;
    } else {
      outtext += intext.charAt(i);
    }
  }
  return outtext;
}

export function encrypt(key) {
  return plainText => algorithm(key, plainText);
}

export function decrypt(key) {
  return cipherText => algorithm(key, cipherText);
}
