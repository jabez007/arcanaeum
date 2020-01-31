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
        <h5 class="headline">The Simple Substitution Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The simple substitution cipher is a cipher that has been in use for many hundreds of years (an excellent history is given in Simon Singhs 'the Code Book').
          It basically consists of substituting every plaintext character for a different ciphertext character. It differs from the
          <a
            @click="$router.push('/cryptotron/ceasar')"
          >Caesar cipher</a> in that the cipher alphabet is not simply the alphabet shifted,
          it is completely jumbled.
        </p>
        <p>
          Still though, the simple substitution cipher offers very little communication security, and it will be shown that it can be easily broken even by hand,
          especially as the messages become longer (more than several hundred ciphertext characters).
        </p>
        <p>
          Keys for the simple substitution cipher consist of 26 letters (compared to the caeser cipher's single number).
          So encyption is just each character in the plaintext replaced with the corresponding letter in the key or cipher alphabet.
          Decryption is just as easy, by going from the cipher alphabet back to the plain alphabet.
        </p>
        <p>
          When generating keys it is popular to use a key word, e.g.
          <a
            class="example"
            @click="key.keyword = 'uncopyrightable' "
          >'uncopyrightable'</a>,
          or a phrase, e.g.
          <a
            class="example"
            @click="key.keyword = 'the quick brown fox jumps over the lazy dog'"
          >'the quick brown fox jumps over the lazy dog'</a>,
          to generate it,
          since it is much easier to remember a key word or phrase compared to a random jumble of 26 characters.
          Or, another popular key for the Simple Substitution cipher is known as the
          <a
            class="example"
            @click="key.keyword = 'qwertyuiopasdfghjklzxcvbnm'"
          >'QWERTY'</a>
          key, based on the standard layout for a US keyboard.
        </p>
      </v-card-text>
    </v-card>
    <substitution-key slot="key" v-model="key"></substitution-key>
  </Cipher>
</template>

<script>

// @ is an alias to /src
import { alphaLower } from '_/CryptoTron/ciphers';
import { encrypt, decrypt } from '_/CryptoTron/ciphers/substitution';
import Cipher from '@/components/CryptoTron/Cipher.vue';
import SubstitutionKey from '@/components/CryptoTron/CipherKeys/SubstitutionKey.vue';

export default {
  components: {
    Cipher,
    SubstitutionKey,
  },
  data: () => ({
    key: {
      plainAlphabet: [...alphaLower],
      keyword: '',
      cipherAlphabet: [...alphaLower],
    },
  }),
  methods: {
    encrypt(plainText, key) {
      return encrypt(key)(plainText);
    },
    decrypt(cipherText, key) {
      return decrypt(key)(cipherText);
    },
    possibleKeys(cipherKey, cipherText, bestCipherKey) {
      if (!bestCipherKey) { // first pass is ''
        return this.key;
      }
      // swap two letters in the current best key.
      const cipherAlphabet = bestCipherKey.cipherAlphabet.slice();
      const a = Math.floor((Math.random() * cipherAlphabet.length));
      const b = Math.floor((Math.random() * cipherAlphabet.length));
      [cipherAlphabet[a]] = cipherAlphabet.splice(b, 1, cipherAlphabet[a]);
      // reassemble new cipherKey to attempt.
      return {
        plainAlphabet: bestCipherKey.plainAlphabet,
        keyword: cipherAlphabet.join(''),
        cipherAlphabet,
      };
    },
    onUpdateKey(newKey) {
      this.key = newKey;
    },
  },
};
</script>
