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
// eslint-disable-next-line import/no-extraneous-dependencies
import Rules from '_/rules';

function findEncoding(block) {
  return e => (e || {}).encoding === (block || '');
}

export default {
  components: {
    Cipher,
  },
  data: () => ({
    encoding: {
      A: 'aaaaa',
      B: 'aaaab',
      C: 'aaaba',
      D: 'aaabb',
      E: 'aabaa',
      F: 'aabab',
      G: 'aabba',
      H: 'aabbb',
      I: 'abaaa',
      J: 'abaab',
      K: 'ababa',
      L: 'ababb',
      M: 'abbaa',
      N: 'abbab',
      O: 'abbba',
      P: 'abbbb',
      Q: 'baaaa',
      R: 'baaab',
      S: 'baaba',
      T: 'baabb',
      U: 'babaa',
      V: 'babab',
      W: 'babba',
      X: 'babbb',
      Y: 'bbaaa',
      Z: 'bbaab',
    },
    message: '',
    keyIsValid: false,
  }),
  computed: {
    rules() {
      return [Rules.required];
    },
  },
  methods: {
    encrypt(plaintext, key) {
      const plainText = (plaintext || '').toUpperCase();
      let cipherText = '';
      for (let i = 0; i < plainText.length; i += 1) {
        const char = plainText[i];
        if (key.encoding[char]) {
          cipherText += key.encoding[char];
        } else {
          cipherText += char;
        }
      }
      return cipherText.replace(/[^ab]/g, '');
    },
    enstegano(encoding, message) {
      if (message) {
        const re = /[a-zA-Z]/;
        let steganograph = '';
        let i = 0;
        for (let j = 0; j < message.length; j += 1) {
          const char = message[j];
          if (re.test(char)) {
            if (encoding[i] === 'a') {
              steganograph += char.toLowerCase();
              i += 1;
            } else if (encoding[i] === 'b') {
              steganograph += char.toUpperCase();
              i += 1;
            }
          } else {
            steganograph += char;
          }
        }
        return steganograph;
      }
      return '';
    },
    decrypt(ciphertext, key) {
      const getUniqueCharacters = (input) => {
        const str = input || '';
        let unique = '';
        for (let i = 0; i < str.length; i += 1) {
          if (i === str.lastIndexOf(str[i])) {
            unique += str[i];
          }
        }
        return unique;
      };
      const unique = getUniqueCharacters(
        (ciphertext || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      );
      if (unique.length === 2) {
        // we have just the encoding
        const cipherText = ciphertext.toLowerCase();
        const encoding = Object.keys(key.encoding).map(char => ({
          char,
          encoding: key.encoding[char],
        }));
        let block = '';
        let plainText = '';
        for (let i = 0; i < cipherText.length; i += 1) {
          const char = cipherText[i];
          if (char === 'a' || char === 'b') {
            block += char;
            if (block.length === 5) {
              plainText += encoding.find(findEncoding(block)).char;
              block = '';
            }
          } else {
            plainText += char;
          }
        }
        return plainText;
      }
      if (unique.length > 0) {
        // or we have the steganograph
        const lowerCase = /[a-z]/;
        const upperCase = /[A-Z]/;
        let encoding = '';
        for (let i = 0; i < ciphertext.length; i += 1) {
          const char = ciphertext[i];
          if (lowerCase.test(char)) {
            encoding += 'a';
          } else if (upperCase.test(char)) {
            encoding += 'b';
          }
        }
        return this.decrypt(encoding, key);
      }
      return '';
    },
  },
};
</script>
