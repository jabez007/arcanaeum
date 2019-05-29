<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{ keyword }"
  >
    <v-card slot="description">
        <v-card-title>
        <h5 class="headline">The Columnar Transposition Cipher</h5>
      </v-card-title>
      <v-card-text>
          <p>
              The columnar transposition cipher is a fairly simple, easy to implement cipher.
              It follows a simple rule for mixing up the characters in the plaintext to form the ciphertext.
              The message is written out in rows of a fixed length, and then read out again column by column,
              and the columns are chosen in some scrambled order.
          </p>
          <p>
              Both the width of the rows and the permutation of the columns are usually defined by a keyword.
              For example, the keyword <q>ZEBRAS</q>  is of length 6 (so the rows are of length 6),
              and the permutation is defined by the alphabetical order of the letters in the keyword.
              In this case, the order would be "6 3 2 4 1 5".
              In a regular columnar transposition cipher, any spare spaces are filled with nulls;
              in an irregular columnar transposition cipher, the spaces are left blank.
              Finally, the message is read off in columns, in the order specified by the keyword.
          </p>
          <h6 class="title">Example</h6>
          <p>
            Suppose we use the keyword <a @click="keyword = 'zebras'">ZEBRAS</a> and the message <q>WE ARE DISCOVERED. FLEE AT ONCE.</q>
          </p>
          <p>
              In a regular columnar transposition,
          </p>
          <p>
              In an irregular columnar transposition,
          </p>
          <p>
              Although stronger than the Rail-Fence cipher, it is still considered weak on its own,
              but it can be combined with other ciphers, such as a substitution cipher;
              the combination of which can be more difficult to break than either cipher on it's own.
              For example, the ADFGVX cipher also uses a columnar transposition to greatly improve its security.
          </p>
      </v-card-text>
    </v-card>
    <v-flex slot="key" xs9>
      <v-form ref="columnarKeyForm"
              v-model="keyIsValid">
        <v-text-field
          label="Key Word"
          v-model.trim="keyword"
          :rules="rules"
          required
          clearable
        ></v-text-field>
        <v-text-field
          label="Sorted"
          :value="(keyword || '').toLowerCase().split('').sort().join('')"
          disabled
          readonly
        ></v-text-field>
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
    keyIsValid: false,
  }),
  computed: {
    rules() {
      return [Rules.required, Rules.word, Rules.minLength(2)];
    },
  },
  methods: {
    encrypt(plainText, cipherKey) {
      if (this.$refs.columnarKeyForm.validate()) {
        const plaintext = (plainText || '').toLowerCase().replace(/[^a-z]/g, '');
        const keywordArray = cipherKey.keyword.split('');
        const sortedKeyword = [...keywordArray];
        sortedKeyword.sort(); // sorts the elements of array IN PLACE
        let ciphertext = '';
        for (let i = 0; i < sortedKeyword.length; i += 1) {
          const index = keywordArray.indexOf(sortedKeyword[i]);
          // remove used letters as we go in case of duplicates
          keywordArray.splice(index, 1, '');
          for (let j = index; j < plaintext.length; j += cipherKey.keyword.length) {
            ciphertext += plaintext.charAt(j);
          }
        }
        return ciphertext;
      }
      return '';
    },
    decrypt(cipherText, cipherKey) {
      if (this.$refs.columnarKeyForm.validate()) {
        const ciphertext = (cipherText || '');
        const keywordArray = cipherKey.keyword.split('');
        const sortedKeyword = [...keywordArray];
        sortedKeyword.sort(); // sorts the elements of array IN PLACE
        const plaintext = new Array(ciphertext.length);
        let k = 0;
        for (let i = 0; i < sortedKeyword.length; i += 1) {
          const index = keywordArray.indexOf(sortedKeyword[i]);
          // remove used letters as we go in case of duplicates
          keywordArray.splice(index, 1, '');
          for (let j = index; j < ciphertext.length; j += cipherKey.keyword.length) {
            plaintext[j] = ciphertext[k];
            k += 1;
          }
        }
        return plaintext.join('');
      }
      return '';
    },
    possibleKeys(cipherKey, cipherText, bestCipherKey) {},
    onUpdateKey(newKey) {
      this.keyword = newKey.keyword;
    },
  },
};
</script>
