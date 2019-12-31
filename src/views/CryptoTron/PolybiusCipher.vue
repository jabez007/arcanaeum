<template>
  <Cipher :encryptAlgorithm="encrypt"
          :decryptAlgorithm="decrypt"
          :cipherKey="{ square, chars }"
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
        <v-layout row>
          <v-spacer></v-spacer>
          <v-flex xs3>
            <table style="table-layout:fixed; width: 100px;">
              <thead>
                <tr>
                  <td></td>
                  <td v-for="c in 5"
                      :key="c"
                      style="color:red;">
                    {{ (cipherChars || '').charAt(c - 1) }}
                  </td>
                </tr>
              </thead>
              <tr v-for="r in 5"
                  :key="r">
                <td style="color:red;">{{ (cipherChars || '').charAt(r - 1) }}</td>
                <td v-for="c in 5"
                    :key="c">
                  {{ square[r-1][c-1] }}
                </td>
              </tr>
            </table>
          </v-flex>
          <v-spacer></v-spacer>
        </v-layout>
        <p>
          Encryption then is just a matter of finding the letter from your plaintext in that square.
          The ciphertext is the (row, column) coordinate for the plaintext in the square.
        </p>
      </v-card-text>
    </v-card>
    <v-flex slot="key"
            xs9>
      <v-form ref="polybiusKeyForm"
              v-model="keyIsValid">
          <v-layout row
                    wrap>
            <v-flex xs12
                    md9>
              <v-text-field label="Keyword"
                            v-model.trim="keyword"
                            :rules="keywordRules"
                            required
                            clearable>
              </v-text-field>
            </v-flex>
            <v-spacer></v-spacer>
            <v-flex xs12
                    md2>
              <v-text-field label="Ciphertext Characters"
                            v-model.trim="cipherChars"
                            :rules="cipherCharRules"
                            required
                            clearable>
              </v-text-field>
            </v-flex>
          </v-layout>
      </v-form>
    </v-flex>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import Rules from '_/rules';
import { alphaLower, getUniqueCharacters } from '_/CryptoTron/ciphers';
import { encrypt, decrypt } from '_/CryptoTron/ciphers/polybius';

export default {
  components: {
    Cipher,
  },
  data: () => ({
    keyword: '',
    cipherChars: 'ABCDE',
    keyIsValid: false,
  }),
  computed: {
    keywordRules() {
      return [Rules.required, Rules.word];
    },
    cipherCharRules() {
      return [Rules.required, Rules.exactLength(5)];
    },
    square() {
      const key = getUniqueCharacters(`${this.keyword}${alphaLower}`).replace(/[jJ]/g, '');
      const cipherSquare = new Array(5).fill(null).map(() => (new Array(5).fill(null)));
      for (let i = 0; i < key.length; i += 1) {
        const char = key.charAt(i);
        const column = i % 5;
        const row = Math.floor(i / 5);
        cipherSquare[row][column] = char;
      }
      return cipherSquare;
    },
    chars() {
      return (this.cipherChars || '').substring(0, 5);
    },
  },
  methods: {
    encrypt(plainText, cipherKey) {
      if (this.$refs.polybiusKeyForm.validate()) {
        return encrypt(plainText, cipherKey.square, cipherKey.chars);
      }
      return '';
    },
    decrypt(cipherText, cipherKey) {
      if (this.$refs.polybiusKeyForm.validate() && cipherText) {
        return decrypt(cipherText, cipherKey.square, cipherKey.chars);
      }
      return '';
    },
    possibleKeys(cipherKey, cipherText, bestCipherKey) {
      if (!bestCipherKey) { // first pass is ''
        const self = this;
        return { square: self.square, chars: self.chars };
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
      return { square: cipherSquare, chars: String(bestCipherKey.chars) };
    },
    onUpdateKey(newKey) {
      let key = '';
      for (let r = 0; r < 5; r += 1) {
        for (let c = 0; c < 5; c += 1) {
          key += newKey.square[r][c];
        }
      }
      this.keyword = key;
    },
  },
};
</script>

<style scoped>
</style>
