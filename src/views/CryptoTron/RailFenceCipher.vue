<template>
  <Cipher
    :encryptAlgorithm="encrypt"
    :decryptAlgorithm="decrypt"
    :cipherKey="{ rails }"
    :keysGenerator="possibleKeys"
    @update-key="onUpdateKey"
  >
    <v-card slot="description">
      <v-card-title>
        <h5 class="headline">The Rail-Fence Cipher</h5>
      </v-card-title>
      <v-card-text>
        <p>
          The rail-fence cipher (also called a zigzag cipher) is a very simple form of transposition cipher.
          It derives its name from the way in which it is encoded,
          following a simple rule for mixing up the characters in the plaintext to form the ciphertext.
        </p>
        <p>
          The rail-fence cipher is often decribed as a "write down the columns, read along the rows" cipher.
          This is equivalent to using an un-keyed columnar transposition cipher.
        </p>
        <p>
          The rail-fence cipher offers essentially no communication security, and can be easily broken even by hand.
          Although weak on its own, it can be combined with other ciphers, such as a
          <a
            @click="$router.push('/cryptotron/substitution')"
          >substitution cipher</a>,
          the combination of which is more difficult to break than either cipher on it's own.
        </p>

        <h6 class="title">Example</h6>
        <p>
          The key for the railfence cipher is just the number of rails.
          To encrypt a piece of text, the plain text is written downwards and diagonally on successive "rails" of an imaginary fence,
          then moving up when we reach the bottom rail.
          When we reach the top rail, the message is written downwards again until the whole plaintext is written out.
          The message is then read off in rows.
        </p>
        <p></p>
        <p>
          For example, if we have
          <a @click="rails=3">3 rails</a>
          and a message of
          <q>WE ARE DISCOVERED. FLEE AT ONCE</q>
          then the cipher text reads off as
          <q>WECRLTEERDSOEEFEAOCAIVDEN</q>
        </p>
        <v-scale-transition>
          <v-card v-if="rails === 3">
            <v-card-text>
              <v-layout v-for="i in 3" :key="i" align-center row>
                <v-flex v-for="j in 12" :key="j" style="color: orange;" xs12>{{ cipherGrid[i-1][j-1] }}</v-flex>
              </v-layout>
            </v-card-text>
          </v-card>
        </v-scale-transition>
      </v-card-text>
    </v-card>
    <v-form slot="key" ref="railFenceKeyForm" v-model="keyIsValid">
      <v-text-field
        label="Number of Rails"
        v-model.number="rails"
        type="number"
        :rules="[rules.required, rules.number, rules.positive]"
        clearable
        required
      ></v-text-field>
    </v-form>
  </Cipher>
</template>

<script>
// @ is an alias to /src
import Cipher from '@/components/CryptoTron/Cipher.vue';

function cycleLength(rails) {
  return Math.max(0, (2 * rails) - 2); // 0 is our min cycle length
}

export default {
  components: {
    Cipher,
  },
  data: () => ({
    rails: 1,
    cipherGrid: new Array(3).fill('-').map(() => new Array(12).fill('-')),
    cipherGridText: '',
    rules: {
      required: value => !!value || 'A key is required',
      number: value => (!!value && Number.isInteger(Number(value)))
        || 'The key must be an integer',
      positive: value => (!!value && value > 0) || 'The key must be positive',
    },
    keyIsValid: true,
  }),
  watch: {
    cipherGridText(newVal) {
      const self = this;
      this.$nextTick(() => {
        const rails = self.cipherGrid.length; // 3
        let column = 0; // each character has it's own column
        let row = 0;
        while (column < self.cipherGrid[row].length) {
          while (row < rails - 1) {
            if (newVal.charAt(column)) {
              self.cipherGrid[row].splice(column, 1, newVal.charAt(column));
            } else {
              self.cipherGrid[row].splice(column, 1, '-');
            }
            column += 1;
            row += 1;
          }
          while (row > 0) {
            if (newVal.charAt(column)) {
              self.cipherGrid[row].splice(column, 1, newVal.charAt(column));
            } else {
              self.cipherGrid[row].splice(column, 1, '-');
            }
            column += 1;
            row -= 1;
          }
        }
      });
    },
  },
  methods: {
    encrypt(plainText, cipherKey) {
      if (this.$refs.railFenceKeyForm.validate() && plainText) {
        const plaintext = plainText.toLowerCase().replace(/[^a-z]/g, '');
        //this.cipherGridText = plaintext;
        if (cipherKey.rails === 1) {
          this.computedCipherText = plaintext;
          return plaintext;
        }
        let ciphertext = '';
        for (let i = 0; i < cipherKey.rails; i += 1) {
          // write down/up the columns
          const downCycle = cycleLength(cipherKey.rails - i);
          const upCycle = cycleLength(i + 1);
          // read along the rows
          let j = i;
          if (j < plaintext.length) {
            ciphertext += plaintext[j];
          }
          while (j < plaintext.length) {
            if (downCycle) {
              j += downCycle;
              if (j < plaintext.length) {
                ciphertext += plaintext[j];
              }
            }
            if (upCycle) {
              j += upCycle;
              if (j < plaintext.length) {
                ciphertext += plaintext[j];
              }
            }
          }
        }
        console.log(ciphertext);
        return ciphertext;
      }
      //this.cipherGridText = '';
      return '';
    },
    decrypt(cipherText, cipherKey) {
      if (this.$refs.railFenceKeyForm.validate() && cipherText) {
        const ciphertext = cipherText.toLowerCase().replace(/[^a-z]/g, '');
        if (cipherKey.rails === 1) {
          //this.cipherGridText = ciphertext;
          return ciphertext;
        }
        const plaintext = new Array(ciphertext.length);
        let k = 0;
        for (let i = 0; i < cipherKey.rails; i += 1) {
          // read down/up the columns
          const downCycle = cycleLength(cipherKey.rails - i);
          const upCycle = cycleLength(i + 1);
          // write along the rows
          let j = i;
          plaintext[j] = ciphertext[k];
          k += 1;
          while (j < ciphertext.length) {
            if (downCycle) {
              j += downCycle;
              if (j < ciphertext.length) {
                plaintext[j] = ciphertext[k];
                k += 1;
              }
            }
            if (upCycle) {
              j += upCycle;
              if (j < ciphertext.length) {
                plaintext[j] = ciphertext[k];
                k += 1;
              }
            }
          }
        }
        const ptext = plaintext.join('');
        console.log(ptext);
        //this.cipherGridText = ptext;
        return ptext;
      }
      //this.cipherGridText = '';
      return '';
    },
    possibleKeys(key, ciphertext) {
      if (!key) {
        // first pass is ''
        return { rails: 1 };
      }
      if (key.rails >= ciphertext.length) {
        return null;
      }
      return { rails: key.rails + 1 };
    },
    onUpdateKey(newKey) {
      this.rails = newKey.rails;
    },
  },
};
</script>

<style scoped>
</style>
