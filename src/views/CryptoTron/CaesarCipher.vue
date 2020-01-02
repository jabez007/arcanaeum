<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="key"
    :keysGenerator="possibleKeys"
    @update-key="onUpdateKey"
  >
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
          The widely known
          <a @click="shift=13">ROT13</a> 'encryption' is simply a Caesar cipher with an offset of 13.
          The Caesar cipher offers essentially no communication security as it can be easily broken even by hand.
        </p>
      </v-card-text>
    </v-card>
    <caesar-key slot="key" v-model="key"></caesar-key>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import CaesarKey from '@/components/CryptoTron/CipherKeys/CaesarKey.vue';
import { encrypt, decrypt } from '_/CryptoTron/ciphers/caesar';

export default {
  components: {
    Cipher,
    CaesarKey,
  },
  data: () => ({
    key: {
      shift: 0,
    },
  }),
  methods: {
    encrypt(plainText, key) {
      return encrypt(key)(plainText);
    },
    decrypt(cipherText, key) {
      return decrypt(key)(cipherText);
    },
    possibleKeys(key) {
      if (!key) {
        // first pass is ''
        return { shift: 1 };
      }
      if (key.shift >= 26) {
        return null;
      }
      return { shift: key.shift + 1 };
    },
    onUpdateKey(newKey) {
      this.shift = newKey.shift;
    },
  },
};
</script>

<style scoped>
</style>
