<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{ cipherAlphabet }"
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
            @click="keyword = 'zebra'"
          >'zebra'</a> to generate it,
          since it is much easier to remember a key word compared to a random jumble of 26 characters.
          Or, another popular key for the Simple Substitution cipher is known as the
          <a
            @click="keyword = 'qwertyuiopasdfghjklzxcvbnm'"
          >'QWERTY'</a> key.
        </p>
      </v-card-text>
    </v-card>
    <v-flex slot="key" xs11>
      <v-layout row>
        <div>
          <v-chip 
            v-for="char in plainAlphabet" 
            :key="char"
            style="margin: 1px !important"
            label
            small>
              {{ char.toLowerCase() }}
          </v-chip>
        </div>
      </v-layout>
      <v-layout row>
        <draggable v-model="cipherAlphabet" group="cipherAlphabet">
          <transition-group>
            <v-chip 
              v-for="char in cipherAlphabet" 
              :key="char" 
              color="info"
              style="margin: 1px !important"
              label 
              small>
                {{ char }}
            </v-chip>
          </transition-group>
        </draggable>
      </v-layout>
      <v-layout row>
        <v-text-field v-model.trim="keyword" label="Key Word" maxlength="26"></v-text-field>
      </v-layout>
    </v-flex>
  </Cipher>
</template>

<script>
import draggable from 'vuedraggable';
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

function getUniqueCharacters(str) {
  str = str || '';
  let unique = '';
  for (let i = 0; i < str.length; i += 1) {
    if (!unique.includes(str[i])) {
      unique += str[i];
    }
  }
  return unique;
}

export default {
  components: {
    Cipher,
    draggable,
  },
  data: () => ({
    plainAlphabet: Array.apply(null, Array(26)).map((v, i) => String.fromCharCode(65 + i)),
    keyword: '',
    cipherAlphabet: Array.apply(null, Array(26)).map((v, i) => String.fromCharCode(97 + i)),
    keyIsValid: false,
  }),
  watch: {
    keyword(newVal) {
      this.cipherAlphabet.sort();
      const str = getUniqueCharacters(newVal.toLowerCase());
      for (let i = 0; i < str.length; i += 1) {
        const char = str.charAt(i);
        if (this.cipherAlphabet.includes(char)) {
          this.cipherAlphabet.splice(this.cipherAlphabet.indexOf(char), 1);
          this.cipherAlphabet.splice(i, 0, char);
        }
      }
    },
  },
  methods: {
    encrypt(plainText, key) {},
    decrypt(ciphertext, key) {},
    possibleKeys(cipherKey, cipherText, bestCipherKey) {},
    onUpdateKey(newKey) {},
  },
};
</script>
