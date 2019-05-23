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
          It can ususally be detected if there are only 5 or 6 different characters in the ciphertext.
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
                  <td v-for="i in 5"
                      :key="i"
                      style="color:red;">
                    {{ (cipherChars || '').charAt(i - 1) }}
                  </td>
                </tr>
              </thead>
              <tr v-for="j in 5"
                  :key="j">
                <td style="color:red;">{{ (cipherChars || '').charAt(j - 1) }}</td>
                <td v-for="i in 5"
                    :key="i">
                  {{ square[i-1][j-1] }}
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
// eslint-disable-next-line import/no-extraneous-dependencies
import Rules from '_/rules';

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
      let key = this.getUniqueCharacters(this.keyword).replace(/[jJ]/g, '');
      const cipherSquare = new Array(5).fill(null).map(() => (new Array(5).fill(null)));
      for (let i = 0; i < key.length; i += 1) {
        const char = key.charAt(i);
        const column = i % 5;
        const row = Math.floor(i / 5);
        cipherSquare[column][row] = char;
      }
      for (let i = 0; i < 26; i += 1) {
        const char = String.fromCharCode(i + 97);
        if (char !== 'j' && key.indexOf(char) === -1) {
          key += char;
          const column = (key.length - 1) % 5;
          const row = Math.floor((key.length - 1) / 5);
          cipherSquare[column][row] = char;
        }
      }
      return cipherSquare;
    },
    chars() {
      return (this.cipherChars || '').substring(0, 5);
    },
  },
  methods: {
    getUniqueCharacters(input) {
      const str = input || '';
      let unique = '';
      for (let i = 0; i < str.length; i += 1) {
        if (!unique.includes(str[i])) {
          unique += str[i];
        }
      }
      return unique;
    },
    encrypt(plainText, cipherKey) {
      if (this.$refs.polybiusKeyForm.validate()) {
        const plaintext = (plainText || '').toLowerCase();
        let key = '';
        for (let j = 0; j < 5; j += 1) {
          for (let i = 0; i < 5; i += 1) {
            key += cipherKey.square[i][j];
          }
        }
        let ciphertext = '';
        const re = /[a-z]/;
        for (let i = 0; i < plaintext.length; i += 1) {
          const char = plaintext[i];
          if (re.test(char)) {
            const pos = key.indexOf(char);
            const column = pos % 5;
            const row = Math.floor(pos / 5);
            ciphertext += cipherKey.chars.charAt(row) + cipherKey.chars.charAt(column);
          } else {
            ciphertext += char;
          }
        }
        return ciphertext;
      }
      return '';
    },
    decrypt(ciphertext, cipherKey) {
      if (this.$refs.polybiusKeyForm.validate() && ciphertext) {
        let plaintext = '';
        let i = 0;
        while (i < ciphertext.length) {
          if (cipherKey.chars.indexOf(String(ciphertext.charAt(i))) !== -1) {
            const row = cipherKey.chars.indexOf(String(ciphertext.charAt(i)));
            i += 1;
            const column = cipherKey.chars.indexOf(String(ciphertext.charAt(i)));
            plaintext += cipherKey.square[column][row];
          } else {
            plaintext += ciphertext.charAt(i);
          }
          i += 1;
        }
        return plaintext;
      }
      return '';
    },
    possibleKeys(cipherKey, cipherText, bestCipherKey) {
      if (!bestCipherKey) { // first pass is ''
        const self = this;
        return { square: self.square, chars: self.chars };
      }
      const flatKey = [];
      for (let j = 0; j < 5; j += 1) {
        for (let i = 0; i < 5; i += 1) {
          flatKey.push(bestCipherKey.square[i][j]);
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
          cipherSquare[column][row] = char;
        }
      }
      return { square: cipherSquare, chars: String(bestCipherKey.chars) };
    },
    onUpdateKey(newKey) {
      let key = '';
      for (let j = 0; j < 5; j += 1) {
        for (let i = 0; i < 5; i += 1) {
          key += newKey.square[i][j];
        }
      }
      this.keyword = key;
    },
  },
};
</script>

<style scoped>
</style>
