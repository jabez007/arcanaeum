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
          <a @click="$router.push('/cryptotron/ceasar')">Caesar cipher</a> in that the cipher alphabet is not simply the alphabet shifted,
          it is completely jumbled.
        </p>
        <p>
          Still though, the simple substitution cipher offers very little communication security, and it will be shown that it can be easily broken even by hand,
          especially as the messages become longer (more than several hundred ciphertext characters).
        </p>
        <p>
          Keys for the simple substitution cipher consist of 26 letters (compared to the caeser cipher's single number).
          So encyption is just each character in the plaintext is replaced with the corresponding letter in the key or cipher alphabet.
          Decryption is just as easy, by going from the cipher alphabet back to the plain alphabet.
          When generating keys it is popular to use a key word, e.g.
          <a @click="keyword = 'zebra'">'zebra'</a> to generate it,
          since it is much easier to remember a key word compared to a random jumble of 26 characters.
        </p>
      </v-card-text>
    </v-card>
    <v-flex slot="key"
            xs9>
        <v-form ref="substitutionKeyForm"
                v-model="keyIsValid">
            <v-layout row
                      wrap>
                <v-flex xs6
                        sm2
                        md1
                        v-for="i in 26"
                        :key="i">
                    <v-select :label="String.fromCharCode(64 + i)"
                              :items="availableAlphabet.filter(char => !cipherKey.includes(char))"
                              v-model="cipherAlphabet[i - 1][0]"
                              chips>
                        <template v-slot:selection="{ item }">
                            <v-chip color="info">
                                <span>{{ item }}</span>
                            </v-chip>
                        </template>
                    </v-select>
                </v-flex>
            </v-layout>
        </v-form>
    </v-flex>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';
import { setTimeout } from 'timers';



export default {
    components: {
        Cipher,
    },
    data: () => ({
        plainAlphabet: [],
        keyword: '',
        cipherAlphabet: Array.apply(null, Array(26)).map(() => [] ),
        keyIsValid: false,
    }),
    computed: {
        cipherKey() {
            return this.cipherAlphabet.flat();
        },
        availableAlphabet() {
            return this.plainAlphabet; //.filter(char => !this.cipherKey.includes(char));
        },
    },
    created() {
        for (let i = 0; i < 26; i += 1) {
            const char = String.fromCharCode(97 + i);
            this.plainAlphabet.push(char);
        }
    },
    methods: {
        validateCipherKeySelection(index, value) {
            const self = this;
            if (!this.cipherKey.includes(value)) {
                setTimeout(() => {
                    self.plainAlphabet.splice(self.plainAlphabet.indexOf(value), 1);  // delete plain alphabet letter
                }, 1000);
                this.cipherAlphabet.splice(index - 1, 1, [value]);  // add to cipher cipher alphabet
                //setTimeout(() => self.$nextTick(() => self.$forceUpdate()), 100);
            }
        },
        encrypt(plainText, key) {

        },
        decrypt(ciphertext, key) {

        },
        possibleKeys(cipherKey, cipherText, bestCipherKey) {

        },
        onUpdateKey(newKey) {
        },
    },
}
</script>

