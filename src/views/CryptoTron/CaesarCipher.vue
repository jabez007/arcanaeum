<template>
  <Cipher :encryptAlgorithm="encrypt"
          :decryptAlgorithm="decrypt"
          :cipherKey="{ shift }"
          :keysGenerator="possibleKeys"
          @update-key="onUpdateKey">
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Caesar Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Caesar cipher is one of the earliest known and simplest ciphers.
          It is a type of substitution cipher in which each letter in the plaintext is 'shifted' a certain number of places down the alphabet.
          For example, with a shift of 1, A would be replaced by B, B would become C, and so on.
          The method is named after Julius Caesar, who apparently used it to communicate with his generals.
        </p>
        <p>
          More complex encryption schemes such as the Vigenère cipher employ the Caesar cipher as one element of the encryption process.
          The widely known <a @click="shift=13">ROT13</a> 'encryption' is simply a Caesar cipher with an offset of 13.
          The Caesar cipher offers essentially no communication security as it can be easily broken even by hand.
        </p>
      </v-card-text>
    </v-card>
    <v-text-field slot="key"
                  type="number"
                  v-model.number="shift"
                  :rules="[() => !!shift || 'A key is required', () => !!shift && Number.isInteger(Number(shift)) || 'The key must be an integer']"
                  single-line
                  clearable
                  required>
    </v-text-field>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

export default {
  components: {
    Cipher,
  },
  data: () => ({
    shift: 0,
  }),
  methods: {
    encrypt(plainText, key) {
      if (plainText) {
        const plaintext = plainText.toLowerCase();
        let ciphertext = '';
        const re = /[a-z]/;
        for (let i = 0; i < plaintext.length; i += 1) {
          if (re.test(plaintext.charAt(i))) {
            ciphertext += String.fromCharCode((plaintext.charCodeAt(i) - 97 + key.shift) % 26 + 97);
          } else {
            ciphertext += plaintext.charAt(i);
          }
        }
        return ciphertext;
      }
      return '';
    },
    decrypt(cipherText, key) {
      if (cipherText) {
        const ciphertext = cipherText.toLowerCase();
        let plaintext = '';
        const re = /[a-z]/;
        for (let i = 0; i < ciphertext.length; i += 1) {
          if (re.test(ciphertext.charAt(i))) {
            plaintext += String.fromCharCode((ciphertext.charCodeAt(i) - 97 + 26 - key.shift) % 26 + 97);
          } else {
            plaintext += ciphertext.charAt(i);
          }
        }
        return plaintext;
      }
      return '';
    },
    * possibleKeys() {
      let i = 1;
      while (i < 26) {
        yield { shift: i };
        i += 1;
      }
    },
    onUpdateKey(newKey) {
        this.shift = newKey.shift;
    }
  },
};
</script>

<style scoped>
</style>