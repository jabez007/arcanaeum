<template>
  <Cipher :encryptAlgorithm="encrypt"
          :decryptAlgorithm="decrypt"
          :cipherKey="key"
          :keysGenerator="possibleKeys"
          @update-key="onUpdateKey">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Polybius Square Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Polybius Square is essentially identical to the simple substitution cipher, except that each plaintext character is enciphered as 2 ciphertext characters.
          It can usually be detected if there are only 5 or 6 different characters in the ciphertext.
          This algorithm offers very little communication security, and can be easily broken even by hand,
          especially as the messages become longer (more than several hundred ciphertext characters).
        </p>
        <p>
          The key for the Polybius Square usually consist of a 25 letter <q>key square</q>.
          <q>i</q> and <q>j</q> usually share the same position in the square.
          The positions of the letters in the square are govern by a <a @click="keyword='zebra'">key word</a>.
          That <q>key word</q> is written out first (with repeated characters removed), then the rest of the letters from the alphabet are written in order.
        </p>
        <p>
          Encryption then is just a matter of finding the letter from your plaintext in that square.
          The ciphertext is the (row, column) coordinate for the plaintext in the square.
        </p>
      </v-card-text>
    </v-card>
    <polybius-key slot="key" v-model="key"></polybius-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import PolybiusKey from '@/components/CryptoTron/CipherKeys/PolybiusKey.vue';
import { square, encrypt, decrypt } from '_/CryptoTron/ciphers/polybius';

export default {
  components: {
    Cipher,
    PolybiusKey,
  },
  data: () => ({
    key: {
      keyword: '',
      square: square(''),
      cipherChars: 'ABCDE',
    },
  }),
  methods: {
    encrypt(plainText, cipherKey) {
      return encrypt(plainText, cipherKey.square, cipherKey.cipherChars);
    },
    decrypt(cipherText, cipherKey) {
      return decrypt(cipherText, cipherKey.square, cipherKey.cipherChars);
    },
    possibleKeys(cipherKey, cipherText, bestCipherKey) {
      if (!bestCipherKey) { // first pass is ''
        const self = this;
        return { square: self.key.square || square(''), cipherChars: self.key.cipherChars || 'ABCDE' };
      }
      const flatKey = [];
      for (let r = 0; r < 5; r += 1) {
        for (let c = 0; c < 5; c += 1) {
          flatKey.push(bestCipherKey.square[r][c]);
        }
      }
      // swap two letters in the current key.
      const a = Math.floor((Math.random() * flatKey.length));
      const b = Math.floor((Math.random() * flatKey.length));
      [flatKey[a]] = flatKey.splice(b, 1, flatKey[a]);
      // reassemble new cipherKey.
      let key = '';
      const cipherSquare = new Array(5).fill(null).map(() => (new Array(5).fill(null)));
      for (let i = 0; i < 25; i += 1) {
        const char = flatKey[i];
        if (char !== 'j' && key.indexOf(char) === -1) {
          key += char;
          const column = (key.length - 1) % 5;
          const row = Math.floor((key.length - 1) / 5);
          cipherSquare[row][column] = char;
        }
      }
      return { square: cipherSquare, cipherChars: String(bestCipherKey.cipherChars) };
    },
    onUpdateKey(newKey) {
      this.key = newKey;
    },
  },
};
</script>

<style scoped>
</style>
