import { cycleLength } from './cycleLength';

// eslint-disable-next-line import/prefer-default-export
export function encrypt(plainText, rails) {
  const plaintext = (plainText || '').toLowerCase().replace(/[^a-z]/g, '');
  if (rails === 1 || rails >= plaintext.length) {
    return plaintext;
  }
  let ciphertext = '';
  for (let i = 0; i < rails; i += 1) {
    // write down/up the columns
    const downCycle = cycleLength(rails - i);
    const upCycle = cycleLength(i + 1);
    // read along the rows
    let j = i;
    if (j < plaintext.length) {
      ciphertext += plaintext[j];
    }
    while (j < plaintext.length) {
      if (downCycle) {
        j += downCycle;
        if (j < plaintext.length) {
          ciphertext += plaintext[j];
        }
      }
      if (upCycle) {
        j += upCycle;
        if (j < plaintext.length) {
          ciphertext += plaintext[j];
        }
      }
    }
  }
  return ciphertext;
}
