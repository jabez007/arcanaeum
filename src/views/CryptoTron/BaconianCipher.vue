<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{ encoding, message }"
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
    <v-flex slot="key" xs9>
      <v-form ref="baconianKeyForm" v-model="keyIsValid">
        <v-layout row wrap align-center>
          <v-flex lg5 class="hidden-md-and-down">
            <v-layout row wrap>
              <v-flex xs3 v-for="(char, key) in Object.keys(encoding)" :key="key">
                <v-text-field :label="char" v-model="encoding[char]" disabled readonly></v-text-field>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex xs12 lg7>
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
} from '_/CryptoTron/ciphers/baconian';

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
