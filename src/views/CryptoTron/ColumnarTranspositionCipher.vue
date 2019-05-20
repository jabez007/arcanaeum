<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{}"
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
          <p>
              <h6 class="title">Example</h6>
               Suppose we use the keyword <q>ZEBRAS</q> and the message <q>WE ARE DISCOVERED. FLEE AT ONCE.</q>
          </p>
          <p>
              In a regular columnar transposition,
          </p>
          <p>
              In an irregular columnar transposition,
          </p>
          <p>
              Although weak on its own, it can be combined with other ciphers, such as a substitution cipher,
              the combination of which can be more difficult to break than either cipher on it's own.
              The ADFGVX cipher uses a columnar transposition to greatly improve its security.
          </p>
      </v-card-text>
    </v-card>
    <v-flex slot="key"></v-flex>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

export default {
  components: {
    Cipher,
  },
  data: () => ({}),
  methods: {
    encrypt(plainText, cipherKey) {},
    decrypt(cipherText, cipherKey) {},
    possibleKeys(cipherKey, cipherText, bestCipherKey) {},
    onUpdateKey(newKey) {},
  },
};
</script>
