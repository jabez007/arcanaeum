<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="key"
  >
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Huffmanian Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The Huffmanian cipher is a method of steganography (a method of hiding a secret message as opposed to just a cipher) based on the Baconian cipher.
          The difference between the Baconian cipher and this cipher is that this cipher uses a
          <a
            href="https://en.wikipedia.org/wiki/Huffman_coding"
          >Huffman encoding</a>.
          That means instead of each letter of the plain text being replaced by a sequence of 5 characters, each letter of the plain text is replaced by a sequence of variable length.
          This allows more common letters (like E and T) to be encoded using shorter sequences while the least common letters (like Z) are encoded using longer sequences.
          As a consequence, the total length of the encoding will typically be shorter than that of an encoding using the Baconian cipher.
        </p>
        <p>
          This cipher offers very little communication security, as it is a substitution cipher.
          As such all the methods used to cryptanalyse substitution ciphers can be used to break Baconian and Huffmanian ciphers.
          The main advantage of the cipher is that it allows hiding the fact that a secret message has been sent at all.
        </p>
      </v-card-text>
    </v-card>
    <huffmanian-key slot="key" v-model="key"></huffmanian-key>
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
import { encode, decrypt, enstegano } from '_/CryptoTron/ciphers/huffmanian';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import HuffmanianKey from '@/components/CryptoTron/CipherKeys/HuffmanianKey.vue';

export default {
  components: {
    Cipher,
    HuffmanianKey,
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
