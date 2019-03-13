<template>
  <Cipher :encryptAlgorithm="encrypt"
          :decryptAlgorithm="decrypt"
          :cipherKey="{ rails }"
          :keysGenerator="possibleKeys"
          @update-key="onUpdateKey">
    <v-card slot="description">
      <v-card-title>
      <h5 class="headline">The Rail-Fence Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The railfence cipher is a very simple, easy to crack cipher.
          It is a transposition cipher that follows a simple rule for mixing up the characters in the plaintext to form the ciphertext.
          The railfence cipher offers essentially no communication security, and can be easily broken even by hand.
        </p>
        <p>
          Although weak on its own, it can be combined with other ciphers, such as a substitution cipher,
          the combination of which is more difficult to break than either cipher on it's own.
        </p>
        <p>
          The rail-fence cipher is often decribed as a "write down the columns, read along the rows" cipher.
          This is equivalent to using an un-keyed columnar transposition cipher.
        </p>
        <h6 class="title">
          Example
        </h6>
        <p>
          The key for the railfence cipher is just the number of rails.
          To encrypt a piece of text, the plain text is written downwards and diagonally on successive "rails" of an imaginary fence,
          then moving up when we reach the bottom rail.
          When we reach the top rail, the message is written downwards again until the whole plaintext is written out.
          The message is then read off in rows.
        <p>
        <p>
          For example, if we have
          <a @click="rails=3">3 rails</a>
          and a message of <q>WE ARE DISCOVERED. FLEE AT ONCE</q>
          then the cipher text reads off as <q>WECRLTEERDSOEEFEAOCAIVDEN</q>
        </p>
        <v-scale-transition>
          <v-layout v-if="rails === 3"
                    row>
            <v-layout v-for="i in 12"
                      :key="i"
                      align-center
                      column>
              <v-flex v-for="j in 3"
                      :key="j"
                      style="color:orange;"
                      xs12>
                {{ cipherGrid[i-1][j-1] }}
              </v-flex>
            </v-layout>
          </v-layout>
        </v-scale-transition>
      </v-card-text>
    </v-card>
    <v-form slot="key"
            ref="railFenceKeyForm"
            v-model="keyIsValid">
      <v-text-field v-model.number="rails"
                    type="number"
                    :rules="[rules.required, rules.number, rules.positive]"
                    single-line
                    clearable
                    required>
      </v-text-field>
    </v-form>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

export default {
  components: {
    Cipher,
  },
  data: () => ({
    rails: 1,
    cipherGrid: new Array(12).fill('-').map(() => (new Array(3).fill('-'))),
    computedCipherText: '',
    computedPlainText: '',
    rules: {
      required: value => !!value || 'A key is required',
      number: value => !!value && Number.isInteger(Number(value)) || 'The key must be an integer',
      positive: value => !!value && value > 0 || 'The key must be positive',
    },
    keyIsValid: true,
  }),
  watch: {
    computedCipherText() {
      if (this.rails === 3) {
        this.resetCipherGrid();
        let char = 0;
        for (let r = 0; r < this.rails; r += 1) {
          let column = 0;
          while (column < this.computedCipherText.length) {
            let row = 0;
            while (row < this.rails - 1) {
              if (row === r && column < this.computedCipherText.length) {
                if (column < 12) {
                  this.cipherGrid[column].splice(row, 1, this.computedCipherText.charAt(char));
                }
                char += 1;
              }
              column += 1;
              row += 1;
            }
            while (row > 0) {
              if (row === r && column < this.computedCipherText.length) {
                if (column < 12) {
                  this.cipherGrid[column].splice(row, 1, this.computedCipherText.charAt(char));
                }
                char += 1;
              }
              column += 1;
              row -= 1;
            }
          }
        }
      }
    },
    computedPlainText() {
      if (this.rails === 3) {
        this.resetCipherGrid();
        let column = 0; // each character has it's own column
        while (column < this.computedPlainText.length) {
          let row = 0;
          while (row < this.rails - 1) {
            if (this.computedPlainText.charAt(column) && column < 12) {
              this.cipherGrid[column].splice(row, 1, this.computedPlainText.charAt(column));
            }
            column += 1;
            row += 1;
          }
          while (row > 0) {
            if (this.computedPlainText.charAt(column) && column < 12) {
              this.cipherGrid[column].splice(row, 1, this.computedPlainText.charAt(column));
            }
            column += 1;
            row -= 1;
          }
        }
      }
    },
  },
  methods: {
    encrypt(plainText, cipherKey) {
      if (this.$refs.railFenceKeyForm.validate() && plainText) {
        const plaintext = plainText.toLowerCase().replace(/[^a-z]/g, '');
        if (cipherKey.rails === 1) {
          this.computedCipherText = plaintext;
          return plaintext;
        }
        // write down the columns
        const plaintextArray = new Array(plaintext.length).fill(null).map(() => (new Array(cipherKey.rails).fill(null)));
        let column = 0; // each character has it's own column
        while (column < plaintext.length) {
          let row = 0;
          while (row < cipherKey.rails - 1) {
            if (plaintext.charAt(column)) {
              plaintextArray[column][row] = plaintext.charAt(column);
            }
            column += 1;
            row += 1;
          }
          while (row > 0) {
            if (plaintext.charAt(column)) {
              plaintextArray[column][row] = plaintext.charAt(column);
            }
            column += 1;
            row -= 1;
          }
        }
        // read along the rows
        let ciphertext = '';
        for (let j = 0; j < cipherKey.rails; j += 1) {
          for (let i = 0; i < plaintext.length; i += 1) {
            if (plaintextArray[i][j]) {
              ciphertext += plaintextArray[i][j];
            }
          }
        }
        this.computedCipherText = ciphertext;
        return ciphertext;
      }
      this.computedCipherText = '';
      return '';
    },
    decrypt(cipherText, cipherKey) {
      if (this.$refs.railFenceKeyForm.validate() && cipherText) {
        const ciphertext = cipherText.toLowerCase().replace(/[^a-z]/g, '');
        if (cipherKey.rails === 1) {
          this.computedplainText = ciphertext;
          return ciphertext;
        }
        // write along the rows
        const ciphertextArray = new Array(ciphertext.length).fill(null).map(() => (new Array(cipherKey).fill(null)));
        let char = 0;
        for (let r = 0; r < cipherKey.rails; r += 1) {
          let column = 0;
          while (column < ciphertext.length) {
            let row = 0;
            while (row < cipherKey.rails - 1) {
              if (row === r && column < ciphertext.length) {
                ciphertextArray[column][row] = ciphertext.charAt(char);
                char += 1;
              }
              column += 1;
              row += 1;
            }
            while (row > 0) {
              if (row === r && column < ciphertext.length) {
                ciphertextArray[column][row] = ciphertext.charAt(char);
                char += 1;
              }
              column += 1;
              row -= 1;
            }
          }
        }
        // read down the columns
        let plaintext = '';
        for (let i = 0; i < ciphertext.length; i += 1) {
          for (let j = 0; j < cipherKey.rails; j += 1) {
            if (ciphertextArray[i][j]) {
              plaintext += ciphertextArray[i][j];
            }
          }
        }
        this.computedPlainText = plaintext;
        return plaintext;
      }
      this.computedPlainText = '';
      return '';
    },
    * possibleKeys(ciphertext) {
      let rails = 1;
      while (rails < ciphertext.length) {
        yield { rails };
        rails += 1;
      }
    },
    resetCipherGrid() {
      for (let i = 0; i < this.cipherGrid.length; i += 1) {
        for (let j = 0; j < this.cipherGrid[i].length; j += 1) {
          this.cipherGrid[i].splice(j, 1, '-');
        }
      }
    },
    onUpdateKey(newKey) {
        this.rails = newKey.rails;
    }
  },
};
</script>

<style scoped>
</style>