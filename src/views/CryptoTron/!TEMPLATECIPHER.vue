<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{}"
    :keysGenerator="possibleKeys"
    @update-key="onUpdateKey"
  >
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline"></h5>
      </v-card-title>
      <v-card-text></v-card-text>
    </v-card>
    <v-flex slot="key"></v-flex>
  </Cipher>
</template>

<script>
/* eslint-disable */  // <- remove this when creating a new cipher from template
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
