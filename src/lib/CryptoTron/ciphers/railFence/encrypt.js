import { cycleLength } from './cycleLength';

// eslint-disable-next-line import/prefer-default-export
export function encrypt(key) {
  return (plainText) => {
    const plaintext = (plainText || '').toLowerCase().replace(/[^a-z]/g, '');
    if (key.rails === 1 || key.rails >= plaintext.length) {
      return plaintext;
    }
    let ciphertext = '';
    for (let i = 0; i < key.rails; i += 1) {
    // write down/up the columns
      const downCycle = cycleLength(key.rails - i);
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
  };
}
