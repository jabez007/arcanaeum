import { cycleLength } from './cycleLength';

// eslint-disable-next-line import/prefer-default-export
export function decrypt(cipherText, rails) {
  const ciphertext = (cipherText || '').toLowerCase().replace(/[^a-z]/g, '');
  if (rails === 1 || rails >= ciphertext.length) {
    return ciphertext;
  }
  const plaintext = new Array(ciphertext.length);
  let k = 0;
  for (let i = 0; i < rails; i += 1) {
    // read down/up the columns
    const downCycle = cycleLength(rails - i);
    const upCycle = cycleLength(i + 1);
    // write along the rows
    let j = i;
    plaintext[j] = ciphertext[k];
    k += 1;
    while (j < ciphertext.length) {
      if (downCycle) {
        j += downCycle;
        if (j < ciphertext.length) {
          plaintext[j] = ciphertext[k];
          k += 1;
        }
      }
      if (upCycle) {
        j += upCycle;
        if (j < ciphertext.length) {
          plaintext[j] = ciphertext[k];
          k += 1;
        }
      }
    }
  }
  return plaintext.join('');
}
