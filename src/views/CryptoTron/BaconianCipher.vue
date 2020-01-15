<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="key"
  >
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Baconian Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Baconian cipher is a method of steganography (a method of hiding a secret message as opposed to just a cipher) devised by Francis Bacon in 1605.
          The Baconian cipher can also be thought of as a substitution cipher in which each letter is replaced by a sequence of 5 characters.
          In the original cipher, these were sequences of 'A's and 'B's (e.g. the letter 'D' was replaced by 'aaabb', the letter 'O' was replaced by 'abbba' etc).
          The steganography aspect involves preparing a false message with the same number of letters as all of the As and Bs in the real, secret message, and choosing two typefaces, one to represent As and the other Bs.
          Then each letter of the false message must be presented in the appropriate typeface, according to whether it stands for an A or a B.
        </p>
        <p>
          This cipher offers very little communication security, as it is a substitution cipher.
          As such all the methods used to cryptanalyse substitution ciphers can be used to break Baconian ciphers.
          The main advantage of the cipher is that it allows hiding the fact that a secret message has been sent at all.
        </p>
      </v-card-text>
    </v-card>
    <baconian-key slot="key" v-model="key"></baconian-key>
    <v-layout slot="encrypt-cipherText" slot-scope="scope" row wrap>
      <v-flex xs12 md6>
        <v-textarea
          label="Encoding"
          v-model="scope.cipherText"
          outline
          auto-grow
          readonly
        ></v-textarea>
      </v-flex>
      <v-flex xs12 md6>
        <v-textarea
          :label="`Steganograph (${messageLength} / ${scope.cipherText.length})`"
          :value="enstegano(scope.cipherText, key)"
          prepend-inner-icon="file_copy"
          @click:prepend-inner="scope.copyToClipboard(enstegano(scope.cipherText, key))"
          outline
          auto-grow
          readonly
        ></v-textarea>
      </v-flex>
    </v-layout>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import { encode, decrypt, enstegano } from '_/CryptoTron/ciphers/baconian';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import BaconianKey from '@/components/CryptoTron/CipherKeys/BaconianKey.vue';

export default {
  components: {
    Cipher,
    BaconianKey,
  },
  data: () => ({
    key: {
      falseMessage: '',
    },
  }),
  computed: {
    messageLength() {
      return (this.key.falseMessage || '').replace(/[^a-zA-Z]/g, '').length;
    },
  },
  methods: {
    encrypt(plainText) {
      return encode(plainText);
    },
    enstegano(encodedString, key) {
      return enstegano(key)(encodedString);
    },
    decrypt(cipherText) {
      return decrypt()(cipherText);
    },
  },
};
</script>
