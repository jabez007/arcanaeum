<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="key"
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
            Suppose we use the keyword <a @click="key={ keyword: 'zebras' }">ZEBRAS</a> and the message <q>WE ARE DISCOVERED. FLEE AT ONCE.</q>
          </p>
          <v-expand-transition>
            <div v-if="key.keyword === 'zebras'">
              <p>
                In a regular columnar transposition, the message is padded with 'X' (our 'null' in this example) to
                {{ 'WE ARE DISCOVERED. FLEE AT ONCE.'.replace(/[^A-Z]/g, '').padEnd(30, 'X') }}
                <br />
                Then our cipher text will be
                <span class="amber--text">
                  {{ encrypt('WE ARE DISCOVERED. FLEE AT ONCE.'.replace(/[^A-Z]/g, '').padEnd(30, 'X'), { keyword: 'zebras' }) }}
                </span>
              </p>
              <p>
                In an irregular columnar transposition, the message is left as is so the cipher text will be
                <span class="amber--text">
                  {{ encrypt('WE ARE DISCOVERED. FLEE AT ONCE.', { keyword: 'zebras' }) }}
                </span>
                <br />
                This makes decryption slightly more difficult
              </p>
            </div>
          </v-expand-transition>
          <p class="caption">
              Although stronger than the Rail-Fence cipher, it is still considered weak on its own,
              but it can be combined with other ciphers, such as a substitution cipher;
              the combination of which can be more difficult to break than either cipher on it's own.
              For example, the ADFGVX cipher also uses a columnar transposition to greatly improve its security.
          </p>
      </v-card-text>
    </v-card>
    <columnar-transposition-key slot="key" v-model="key"></columnar-transposition-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import ColumnarTranspositionKey from '@/components/CryptoTron/CipherKeys/ColumnarTranspositionKey.vue';
import { encrypt, decrypt } from '_/CryptoTron/ciphers/columnarTransposition';

export default {
  components: {
    Cipher,
    ColumnarTranspositionKey,
  },
  data: () => ({
    key: {
      keyword: '',
    },
  }),
  methods: {
    encrypt(plainText, cipherKey) {
      return encrypt(cipherKey)(plainText);
    },
    decrypt(cipherText, cipherKey) {
      return decrypt(cipherKey)(cipherText);
    },
  },
};
</script>
