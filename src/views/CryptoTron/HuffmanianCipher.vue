<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{ encoding, message }"
  >
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Hoffmanian Cipher</h5>
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
    <v-flex slot="key" xs10>
      <v-form ref="huffmanianKeyForm" v-model="keyIsValid">
        <v-layout row wrap align-center>
          <v-flex lg7 class="hidden-md-and-down">
            <v-layout row wrap>
              <v-flex xs3 v-for="(char, key) in Object.keys(encoding)" :key="key">
                <v-text-field :label="char" v-model="encoding[char]" disabled readonly></v-text-field>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex xs12 lg5>
            <v-textarea
              label="False Message"
              v-model.trim="message"
              :rules="rules"
              clearable
              rows="1"
              auto-grow
              required
            ></v-textarea>
          </v-flex>
        </v-layout>
      </v-form>
    </v-flex>
    <v-layout slot="encrypt-cipherText" slot-scope="scope" row wrap>
      <v-flex xs12 md6>
        <v-textarea
          label="Encoding"
          v-model="scope.cipherText"
          prepend-inner-icon="file_copy"
          @click:prepend-inner="scope.copyToClipboard(scope.cipherText)"
          outline
          auto-grow
          readonly
        ></v-textarea>
      </v-flex>
      <v-flex xs12 md6>
        <v-textarea
          :label="`Steganograph (${message.replace(/[^a-zA-Z]/g, '').length} / ${scope.cipherText.length})`"
          :value="enstegano(scope.cipherText, message)"
          prepend-inner-icon="file_copy"
          @click:prepend-inner="scope.copyToClipboard(enstegano(scope.cipherText, message))"
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
import Cipher from '@/components/CryptoTron/Cipher.vue';
import Rules from '_/rules';
import {
  encoding, encode, decrypt, enstegano,
} from '_/CryptoTron/ciphers/huffmanian';

export default {
  components: {
    Cipher,
  },
  data: () => ({
    message: '',
    keyIsValid: false,
  }),
  computed: {
    encoding() {
      return encoding;
    },
    rules() {
      return [Rules.required];
    },
  },
  methods: {
    encrypt(plainText) {
      return encode(plainText);
    },
    enstegano(encodedString, message) {
      if (message) {
        return enstegano(encodedString, message);
      }
      return '';
    },
    decrypt(cipherText) {
      return decrypt(cipherText);
    },
  },
};
</script>
